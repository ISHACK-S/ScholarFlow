import io
import json
import urllib.request
import urllib.error
from pypdf import PdfWriter

base = 'http://127.0.0.1:8001'
email = 'debugupload+scholarflow@gmail.com'
password = 'TestPassword123!'


def request_json(path, method='GET', body=None, headers=None):
    data = None if body is None else json.dumps(body).encode('utf-8')
    if headers is None:
        headers = {}
    if body is not None and 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.status, res.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

signup_status, signup_text = request_json('/auth/signup', 'POST', {'email': email, 'password': password, 'full_name': 'Debug User'})
print('signup', signup_status, signup_text)
login_status, login_text = request_json('/auth/login', 'POST', {'email': email, 'password': password})
print('login', login_status, login_text)
if login_status != 200:
    raise SystemExit(1)
access_token = json.loads(login_text).get('access_token')

writer = PdfWriter()
writer.add_blank_page(width=72, height=72)
buf = io.BytesIO()
writer.write(buf)
pdf_bytes = buf.getvalue()

boundary = '----boundary123'
body = (
    f'--{boundary}\r\n'
    'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n'
    'Content-Type: application/pdf\r\n\r\n'
).encode('utf-8') + pdf_bytes + (f'\r\n--{boundary}--\r\n').encode('utf-8')

req = urllib.request.Request(
    base + '/upload-note',
    data=body,
    method='POST',
    headers={'Authorization': f'Bearer {access_token}', 'Content-Type': f'multipart/form-data; boundary={boundary}'},
)
try:
    with urllib.request.urlopen(req, timeout=60) as res:
        print('upload', res.status, res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('upload_error', e.code, e.read().decode('utf-8'))
