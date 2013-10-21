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
engine = create_engine('postgres:///wgtg')
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
sockets = Sockets(app)

listeners = []

def listen_for_pushes():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((BIND_IP, PORT))
    while True:
        data, addr = sock.recvfrom(1024)
        session = Session()
        try:
            event = LogEvent()
            session.add(event)
            session.commit()
            for ws in listeners:
                ws.send(event.ts.isoformat() + 'Z')
        except:
            session.rollback()
            raise
        finally:
            session.close()


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
    event_str = '\n'.join([r.ts.isoformat() + 'Z' for r in recent])
    session.close()
    return event_str



gevent.spawn(listen_for_pushes)
