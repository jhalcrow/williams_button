#include <Dns.h>
#include <EthernetUdp.h>
#include <util.h>

#include <SPI.h>
#include <Ethernet.h>
#include <EthernetUdp.h>

#include "pitches.h"

byte mac[] = {  
  0x90, 0xA2, 0xDA, 0x0D, 0xCC, 0x2D
};

const int speakerPin = 6;
const int buttonPin = 5;
const int ledPin = 8;
const int debounceDelay = 100;

const char server_host[] = "ournewballandchain.com";
unsigned int server_port = 8008;
char log_message[] = "BWAANG";

// Close Encounters of The Third Kind
const int song_notes[] = { NOTE_D5, NOTE_E5, NOTE_C5, NOTE_C4, NOTE_G4, -1 };
int song_lens[] = { 64, 64, 64, 64, 64, 256};
const int note_rate = 15;


// Initialize the Ethernet client library
// with the IP address and port of the server 
// that you want to connect to (port 80 is default for HTTP):
EthernetClient client;
EthernetUDP Udp;
DNSClient dnsClient;


void send_message() {
    IPAddress server_ip(107, 21, 122, 218);

    int result = dnsClient.getHostByName(server_host, server_ip);
    Serial.println("Server IP");
    Serial.println(server_ip);
    
    if (result == 1) {
       Udp.beginPacket(server_ip, server_port);
       Udp.write(log_message);
       Udp.endPacket();
       
       Serial.println("Message sent");
    } else {
       Serial.println("Error resolving server host"); 
       Serial.println(result);
    }
}

void play_song() {

  digitalWrite(ledPin, LOW); 
  Serial.println("Playing song");
  for(int i = 0; i < sizeof(song_notes) / sizeof(int); ++i) {
    
    if (song_notes[i] > 0) {
       digitalWrite(ledPin, HIGH);
       tone(speakerPin, song_notes[i], song_lens[i] * note_rate);
       
     }
     delay(song_lens[i] * note_rate);
     digitalWrite(ledPin, LOW);
     // Inter-note spacing
     delay( 100); 
    
  }
  digitalWrite(ledPin, HIGH);
}

void loop() {
  int buttonState = digitalRead(buttonPin);
  Serial.println(buttonState);

  if (buttonState == HIGH) {
    delay(debounceDelay);
    if(digitalRead(buttonPin) == HIGH) {
      play_song();
      send_message();
    } else {
      delay(debounceDelay);
    }
    
  }
 
}

void setup() {
  // start the serial library:
  Serial.begin(9600);
    
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT);
  
//  // start the Ethernet connection:
  int errEthernet = Ethernet.begin(mac);
  if (errEthernet == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
    Serial.println(errEthernet);
    // no point in carrying on, so do nothing forevermore:
    while(true) {
       digitalWrite(ledPin, LOW);
       delay(1000);
       digitalWrite(ledPin, HIGH);
       delay(1000);
    }
  }
  Udp.begin(server_port);
  dnsClient.begin(Ethernet.dnsServerIP());
  
  Serial.println("Connected to network.");
  Serial.println(Ethernet.localIP());


  
  digitalWrite(ledPin, HIGH);
 

}
