from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText

def create_message(to, subject, body):
    msg = MIMEText(body)
    msg['to'] = to
    msg['subject'] = subject
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {'raw': raw}

def send_email(creds, to, subject, body):
    service = build('gmail', 'v1', credentials=creds)
    message = create_message(to, subject, body)
    return service.users().messages().send(userId='me', body=message).execute()
