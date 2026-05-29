#!/usr/bin/env python3
"""Usage: python hash_password.py <password>"""
import sys
import bcrypt

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python hash_password.py <password>")
        sys.exit(1)
    pw = sys.argv[1].encode()
    print(bcrypt.hashpw(pw, bcrypt.gensalt()).decode())
