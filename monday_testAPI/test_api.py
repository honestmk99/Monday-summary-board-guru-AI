import requests
import json
import os
import dotenv
from dotenv import *
import json

load_dotenv()
MONDAY_API_KEY = os.getenv('MONDAY_API_KEY')
apiUrl = "https://api.monday.com/v2"
headers = {"Authorization" : MONDAY_API_KEY, "API-version" : '2023-04'}

query2 = 'query { boards (limit:1) {id name} }'
print(query2)
data = {'query' : query2}

r = requests.post(url=apiUrl, json=data, headers=headers)

print(r.headers)
pretty_json = json.loads(r.text)
print (json.dumps(pretty_json, indent=2))
