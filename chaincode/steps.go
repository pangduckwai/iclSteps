package main

import (
	"errors"
	"fmt"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type SimpleChaincode struct {
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	inp, err := strconv.ParseInt(args[0], 10, 64)
	if err != nil {
		return nil, errors.New("Incorrect type of argument. Expecting numbers")
	}

	valAsbytes, err := stub.GetState("init")
	if err == nil {
		str := string(valAsbytes[:])
		ext, err := strconv.ParseInt(str, 10, 64)
		if err != nil {
			return nil, errors.New("Something very wrong happened...")
		}

		if ext != inp {
			fmt.Printf("New version %d", inp)
			err := stub.PutState("init", []byte(str))
			if err != nil {
				return nil, err
			}
		} else {
			fmt.Printf("Version %d already initialized", ext)
		}
	}

	return nil, nil
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println(" >>>>>>> Invoking " + function)

	if function == "init" {
		return t.Init(stub, "init", args)
	} else if function == "write" {
		return t.write(stub, args)
	}

	return nil, errors.New("Invoking unknown function: " + function)
}

func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println(" >>>>>>> Querying " + function)

	if function == "read" { //read a variable
		return t.read(stub, args)
	}

	return nil, errors.New("Querying unknown function: " + function)
}

// write key/value pair to the ledger
func (t *SimpleChaincode) write(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var key, value string
	var err error

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2 (key / value pair)")
	}

	key = args[0]
	value = args[1]
	err = stub.PutState(key, []byte(value)) //write the variable into the chaincode state
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// read - query function to read key/value pair
func (t *SimpleChaincode) read(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var key, jsonResp string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the key to query")
	}

	key = args[0]
	valAsbytes, err := stub.GetState(key)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
		return nil, errors.New(jsonResp)
	}

	return valAsbytes, nil
}
