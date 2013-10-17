import socket
import datetime
BIND_IP = '0.0.0.0'
PORT = 8008

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

sock.bind((BIND_IP, PORT))

while True:
    data, addr = sock.recvfrom(1024)
    print 'recieved message:', data, 'from', addr