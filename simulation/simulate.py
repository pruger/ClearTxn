import json
import os
import sys
from typing import TypedDict

import requests
from Crypto.Hash import keccak


def starknet_keccak(data: bytes) -> bytes:
    """
    A variant of eth-keccak that computes a value that fits in a Starknet field element.
    """
    k = keccak.new(digest_bits=256)
    k.update(data)
    masked = int.from_bytes(k.digest(), byteorder="big") & (2**250 - 1)  # 250 byte mask
    return masked.to_bytes(length=32, byteorder="big")


def get_abi(class_hash: str) -> dict:
    """
    Retrieve the Application Binary Interface (ABI) for a given class hash.

    This function attempts to fetch the ABI from a locally cached JSON file. If the file does not exist,
    it fetches the ABI from a remote API, caches the result locally, and then returns the ABI.

    Args:
        class_hash (str): The unique identifier for the class whose ABI is to be retrieved.

    Returns:
        dict: A dictionary containing the ABI of the specified class, or None if the ABI is not found.
    """
    file_name = f"class_details/{class_hash}.json"
    if os.path.exists(file_name):
        with open(file_name, "r") as file:
            data = json.load(file)
        return data.get("abi")

    url = f"https://api.voyager.online/beta/classes/{class_hash}"
    headers = {"accept": "application/json", "x-api-key": os.environ.get("API_KEY")}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    os.makedirs("class_details", exist_ok=True)
    with open(file_name, "w") as file:
        file.write(response.text)
    res = response.json()
    return res.get("abi")


def simulate(transaction):
    url = "https://free-rpc.nethermind.io/mainnet-juno/"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(transaction))
    response.raise_for_status()
    # error = response.json().get("error")
    # if error:
    #     raise Exception(error)
    return response.json()


class Info(TypedDict):
    class_hash: str
    entry_point_selector: str
    events: list


def extract_info(simulation_data) -> list:
    events: list[Info] = []

    def get_events_from_call(events, simulation_data):
        events.append(
            Info(
                class_hash=simulation_data["class_hash"],
                entry_point_selector=simulation_data["entry_point_selector"],
                events=simulation_data["events"],
            )
        )
        for call in simulation_data["calls"]:
            get_events_from_call(events, call)

    get_events_from_call(events, simulation_data)
    return events


def parse_info(info: Info):

    def test(name: str, hash_to_find: str):
        name = name.rsplit("::", 1)[-1]
        hash = "0x" + starknet_keccak(name.encode()).hex().lstrip("0")
        return hash == hash_to_find

    def get_function_name(abi, hash_to_find: str) -> str:
        # if hash_to_find == "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e":
        #     return "balanceOf"
        for abi_entry in abi:
            if abi_entry["type"] == "function":
                if test(abi_entry["name"], hash_to_find):
                    return abi_entry["name"].rsplit("::", 1)[-1]
            if abi_entry["type"] == "interface":
                for item in abi_entry["items"]:
                    if item["type"] == "function":
                        if test(item["name"], hash_to_find):
                            return item["name"].rsplit("::", 1)[-1]
        print("not found", hash_to_find, file=sys.stderr)
        return None

    def get_event_name(abi, hash_to_find: str) -> str:
        for abi_entry in abi:
            if abi_entry["type"] == "event":
                if test(abi_entry["name"], hash_to_find):
                    return abi_entry["name"].rsplit("::", 1)[-1]
        return None

    abi = get_abi(info["class_hash"])
    if abi is None:
        return
    result = {}
    result["function"] = get_function_name(abi, info["entry_point_selector"])
    event_names = []
    for e in info["events"]:
        event_names.append(get_event_name(abi, e["keys"][0]))
    result["events"] = event_names
    return result


def get_information(transaction):
    simulation_data = simulate(transaction)
    if simulation_data.get("error"):
        return simulation_data.get("error")["data"]["execution_error"]
    trace = simulation_data["result"][0]["transaction_trace"]["execute_invocation"]
    if trace.get("revert_reason"):
        return trace.get("revert_reason")
    info = extract_info(trace)
    parsed_info = []
    for i in info:
        parsed_info.append(parse_info(i))
    return parsed_info


def main():
    # print(starknet_keccak('balanceOf'.encode()).hex())
    for i in range(1, 5):
        print("==================================================")
        print(i)
        with open(f"test_transactions/{i}.json", "r") as file:
            data = json.load(file)
        info = get_information(data)
        if type(info) == list:
            for i in info:
                print(i)
        else:
            print(info)


if __name__ == "__main__":
    main()
