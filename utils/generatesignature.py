from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
from eth_abi import encode
import secrets
import time
import requests

def generate_signing_account():
    priv = secrets.token_hex(32)
    private_key = "0x" + priv
    account = Account.from_key(private_key)
    return account, private_key

def validate_and_format_private_key(private_key):
    """Validate and format the private key to ensure it's 32 bytes."""
    # Remove '0x' prefix if present
    if private_key.startswith('0x'):
        private_key = private_key[2:]
    
    # Ensure the key is 64 characters (32 bytes) long
    if len(private_key) != 64:
        raise ValueError("Private key must be 64 hexadecimal characters long")
    
    # Add '0x' prefix back
    return "0x" + private_key

def create_registration_signature(signing_address, primary_private_key, expiry_time):
    # Create Web3 instance
    w3 = Web3()
    
    # Encode the parameters using eth_abi directly
    request_args = encode(
        ['address', 'uint256'],
        [Web3.to_checksum_address(signing_address), expiry_time]
    )
    
    # Create the signable message
    message_hash = Web3.keccak(request_args)
    signable_message = encode_defunct(message_hash)
    
    # Sign the message with validated private key
    signed_message = Account.sign_message(signable_message, primary_private_key)
    
    # Add '0x' prefix to signature if not present
    signature = signed_message.signature.hex()
    if not signature.startswith('0x'):
        signature = '0x' + signature
        
    return signature

def register_with_vest_exchange(primary_address):
    try:
        # Generate a new signing account
        signing_account, signing_private_key = generate_signing_account()
        print(f"Generated signing address: {signing_account.address}")
        
        # Calculate expiry time (7 days from now in milliseconds)
        expiry_time = int(time.time() * 1000 + 7 * 24 * 3600 * 1000)
        
        # Get and validate primary private key
        print("\nPlease enter your MetaMask account's private key (64 hex characters):")
        print("(If it starts with '0x', that prefix will be handled automatically)")
        primary_private_key = input().strip()
        
        # Validate and format the private key
        primary_private_key = validate_and_format_private_key(primary_private_key)
        
        print("\nCreating signature...")
        signature = create_registration_signature(
            signing_account.address,
            primary_private_key,
            expiry_time
        )
        
        # Prepare request body
        request_body = {
            "signingAddr": signing_account.address.lower(),
            "primaryAddr": primary_address.lower(),
            "signature": signature,
            "expiryTime": expiry_time
        }
        
        print("\nSending registration request...")
        response = requests.post(
            "https://server-mmdev.vest.exchange/v2/register",
            json=request_body
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\nRegistration successful!")
            print(f"API Key: {result['apiKey']}")
            print(f"Account Group: {result['accGroup']}")
            print(f"\nIMPORTANT: Store these credentials securely!")
            print(f"Signing Private Key: {signing_private_key}")
            return result
        else:
            print(f"\nRegistration failed with status code: {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except ValueError as e:
        print(f"\nError: {str(e)}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    # My MetaMask public address
    PRIMARY_ADDRESS = "0xDA869D245689764874ecD5AC8b97661385a64140"
    
    # Run the registration
    result = register_with_vest_exchange(PRIMARY_ADDRESS)