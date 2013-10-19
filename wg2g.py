from flask import Flask
from flask_sockets import Sockets
import socket
import logging
import datetime
import gevent
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Integer, DateTime, create_engine, desc, Column

Base = declarative_base()
engine = create_engine('sqlite:///wg2g_log.sqlite', echo=True)
Session = sessionmaker(bind=engine)
BIND_IP = '0.0.0.0'
PORT = 8008


class LogEvent(Base):
    __tablename__ = 'log_events'

    id = Column(Integer, primary_key=True)
    ts = Column(DateTime, nullable=False)

    def __init__(self, ts=None):
        if ts is None:
            self.ts = datetime.datetime.utcnow()

    def __repr__(self):
        return '<LogEvent(id=%s, ts=%s)>' % (self.id, self.ts.isoformat())

Base.metadata.create_all(engine)
app = Flask(__name__)
app.debug = True
sockets = Sockets(app)

listeners = []

def listen_for_pushes():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((BIND_IP, PORT))
    while True:
        print 'listening...'
        data, addr = sock.recvfrom(1024)
        print 'recieved message:', data, 'from', addr
        session = Session()
        try:
            event = LogEvent()
            session.add(event)
            session.commit()
            for ws in listeners:
                ws.send(event.ts.isoformat())
        except:
            session.rollback()
            raise
        finally:
            session.close()



@sockets.route('/echo')
def echo_socket(ws):
    while True:
        message = ws.receive()
        ws.send(message + '!!')

@sockets.route('/pushes')
def push_notifier(ws):
    listeners.append(ws)
    mesg = ws.receive()
    listeners.remove(ws)
    ws.close()

@app.route('/recentEvents')
def recent_events():
    session = Session()
    recent = session.query(LogEvent).order_by("ts DESC").limit(20)
    event_str = '\n'.join([r.ts.isoformat() for r in recent])
    session.close()
    return event_str

@app.route('/')
def hello():
    return 'Hello World!'

gevent.spawn(listen_for_pushes)
