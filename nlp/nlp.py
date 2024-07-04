import requests
import json

transcribedText = "Hi, can you help me make a to-do list for this week? I have a lot of things to do, and I want to organize them. First, I need to finish the report for the boss, attend the team meeting on Tuesday at 10 AM, call the client about the new project, review the budget proposal, send the presentation slides to the marketing team, and update the project timeline. At home, I need to mow the lawn, fix the leaky faucet in the kitchen, clean the garage, take out the trash on Thursday, pick up dry cleaning on Friday, and do grocery shopping for milk, eggs, bread, vegetables, and chicken. For personal tasks, I need to exercise by going to the gym on Monday, Wednesday, and Friday, go to the doctor’s appointment on Thursday at 3 PM, call my mom to check on her, read the book I started last week, pay the utility bills online, and plan the weekend trip with my family. I also have some miscellaneous tasks like buying a birthday gift for Sarah, renewing car insurance, making a dentist appointment, responding to emails, and organizing the files on my computer. Can you put all of this into a list for me? Thanks!"

url = "http://localhost:11434/api/generate"
headers = {
    "Content-Type": "application/json",
}
data = {
    "model": "llama3",
    "prompt": transcribedText,
    "stream": False,
}

response = requests.post(url, headers=headers, data=json.dumps(data))
if response.status_code ==200:
    response_text = response.text
    data = json.loads(response_text)
    actual_response = data["response"]
    print(actual_response)
else:
    print("Error:", response.status_code, response.text)
# for token in doc:
#     print(token.text, token.pos_, token.dep_)