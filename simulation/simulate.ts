import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { keccak256 } from 'js-sha3';
import * as dotenv from 'dotenv';

dotenv.config();

interface Info {
  class_hash: string;
  entry_point_selector: string;
  events: any[];
}

function starknetKeccak(data: Buffer): Buffer {
  const hash = keccak256.create();
  hash.update(data);
  const digest = Buffer.from(hash.digest());
  const masked = BigInt('0x' + digest.toString('hex')) & ((1n << 250n) - 1n);
  return Buffer.from(masked.toString(16).padStart(64, '0'), 'hex');
}

async function getAbi(classHash: string): Promise<any> {
  const fileName = path.join('class_details', `${classHash}.json`);
  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName, 'utf-8');
    return JSON.parse(data).abi;
  }

  const url = `https://api.voyager.online/beta/classes/${classHash}`;
  const response = await axios.get(url, {
    headers: {
      accept: 'application/json',
      'x-api-key': process.env.API_KEY
    }
  });
  fs.mkdirSync('class_details', { recursive: true });
  fs.writeFileSync(fileName, JSON.stringify(response.data));
  return response.data.abi;
}

async function simulate(transaction: any): Promise<any> {
  const url = 'https://free-rpc.nethermind.io/mainnet-juno/';
  const response = await axios.post(url, transaction, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

function extractInfo(simulationData: any): Info[] {
  const events: Info[] = [];

  function getEventsFromCall(events: Info[], simulationData: any) {
    events.push({
      class_hash: simulationData.class_hash,
      entry_point_selector: simulationData.entry_point_selector,
      events: simulationData.events,
    });
    for (const call of simulationData.calls) {
      getEventsFromCall(events, call);
    }
  }

  getEventsFromCall(events, simulationData);
  return events;
}

async function parseInfo(info: Info): Promise<any> {
  function test(name: string, hashToFind: string): boolean {
    const namePart = name.split('::').pop();
    const hash = '0x' + starknetKeccak(Buffer.from(namePart || '')).toString('hex').replace(/^0+/, '');
    return hash === hashToFind;
  }

  async function getFunctionName(abi: any, hashToFind: string): Promise<string | null> {
    for (const abiEntry of abi) {
      if (abiEntry.type === 'function' && test(abiEntry.name, hashToFind)) {
        return abiEntry.name.split('::').pop();
      }
      if (abiEntry.type === 'interface') {
        for (const item of abiEntry.items) {
          if (item.type === 'function' && test(item.name, hashToFind)) {
            return item.name.split('::').pop();
          }
        }
      }
    }
    console.error('not found', hashToFind);
    return null;
  }

  async function getEventName(abi: any, hashToFind: string): Promise<string | null> {
    for (const abiEntry of abi) {
      if (abiEntry.type === 'event' && test(abiEntry.name, hashToFind)) {
        return abiEntry.name.split('::').pop();
      }
    }
    return null;
  }

  const abi = await getAbi(info.class_hash);
  if (!abi) return;
  const result: any = {};
  result.function = await getFunctionName(abi, info.entry_point_selector);
  const eventNames: string[] = [];
  for (const e of info.events) {
    const eventName = await getEventName(abi, e.keys[0]);
    if (eventName) {
      eventNames.push(eventName);
    }
  }
  result.events = eventNames;
  return result;
}

async function getInformation(transaction: any): Promise<any> {
  const simulationData = await simulate(transaction);
  if (simulationData.error) {
    return simulationData.error.data.execution_error;
  }
  const trace = simulationData.result[0].transaction_trace.execute_invocation;
  if (trace.revert_reason) {
    return trace.revert_reason;
  }
  const info = extractInfo(trace);
  const parsedInfo = [];
  for (const i of info) {
    parsedInfo.push(await parseInfo(i));
  }
  return parsedInfo;
}

async function main() {
  for (let i = 1; i < 5; i++) {
    console.log('==================================================');
    console.log(i);
    const data = JSON.parse(fs.readFileSync(path.join('test_transactions', `${i}.json`), 'utf-8'));
    const info = await getInformation(data);
    if (Array.isArray(info)) {
      for (const i of info) {
        console.log(i);
      }
    } else {
      console.log(info);
    }
  }
}

if (require.main === module) {
  main().catch(err => console.error(err));
}
