#include <KeyboardBLE.h>

// https://usb.org/hid
// https://usb.org/sites/default/files/hut1_5.pdf -> Consumer page 0x0C, send with consumerPress()
#define KEY_FASTFORWARD 0xB3
#define KEY_REWIND 0xB4
#define KEY_CHANNELUP 0x9C
#define KEY_CHANNELDOWN 0x9D

struct KeyMapping
{
  const char *name;
  uint8_t key;
};

struct ConsumerKeyMapping
{
  const char *name;
  uint16_t key;
};

KeyMapping keyMappings[] = {
    {"KEY_UP_ARROW", KEY_UP_ARROW},
    {"KEY_DOWN_ARROW", KEY_DOWN_ARROW},
    {"KEY_LEFT_ARROW", KEY_LEFT_ARROW},
    {"KEY_RIGHT_ARROW", KEY_RIGHT_ARROW},
    {"KEY_LEFT", KEY_LEFT_ARROW},
    {"KEY_UP", KEY_UP_ARROW},
    {"KEY_RIGHT", KEY_RIGHT_ARROW},
    {"KEY_DOWN", KEY_DOWN_ARROW},
    {"KEY_KPENTER", KEY_KP_ENTER},
    //{"KEY_PROGRAM", },
    {"KEY_ESC", KEY_ESC},
    // Add more mappings for more functions
};

ConsumerKeyMapping consumerKeyMappings[] = {
    {"KEY_SEARCH", KEY_AC_SEARCH},
    {"KEY_REWIND", KEY_REWIND},
    {"KEY_PLAYPAUSE", KEY_PLAY_PAUSE},
    {"KEY_FASTFORWARD", KEY_FASTFORWARD},
    {"KEY_POWER", KEY_POWER},
    {"KEY_BACK", KEY_AC_BACK},
    {"KEY_HOMEPAGE", KEY_AC_HOME},
    {"KEY_MENU", KEY_MENU},
    {"KEY_MUTE", KEY_MUTE},
    {"KEY_VOLUMEUP", KEY_VOLUME_INCREMENT},
    {"KEY_VOLUMEDOWN", KEY_VOLUME_DECREMENT},
    {"KEY_CHANNELUP", KEY_CHANNELUP},
    {"KEY_CHANNELDOWN", KEY_CHANNELDOWN},
};

const int numMappings = sizeof(keyMappings) / sizeof(KeyMapping);
const int consumerNumMappings = sizeof(consumerKeyMappings) / sizeof(ConsumerKeyMapping);

void setup()
{
  Serial.begin(9600);
  KeyboardBLE.begin("openHARMONIE", "openHARMONIE", KeyboardLayout_en_US);
  Serial.println("Keyboard BLE started");
  delay(5000);
}

//Main loop going through all the keys, then waiting 10ms
void loop()
{
  while (Serial.available())
  {
    String input = Serial.readStringUntil('\n');
    input.trim();
    bool found = false;
    for (int i = 0; i < numMappings; i++)
    {
      if (input.equalsIgnoreCase(keyMappings[i].name))
      {
        KeyboardBLE.press(keyMappings[i].key);
        delay(50);
        KeyboardBLE.release(keyMappings[i].key);
        found = true;
        break;
      }
    }
    if (found)
    {
      continue;
    }
    for (int i = 0; i < consumerNumMappings; i++)
    {
      if (input.equalsIgnoreCase(consumerKeyMappings[i].name))
      {
        KeyboardBLE.consumerPress(consumerKeyMappings[i].key);
        delay(50);
        KeyboardBLE.consumerRelease();
        found = true;
        break;
      }
    }
    if (found)
    {
      continue;
    }
    if (input.equalsIgnoreCase("REMOTE_DISCONNECT"))
    {
      KeyboardBLE.end();
      continue;
    }
    if (input.equalsIgnoreCase("REMOTE_CONNECT"))
    {
      KeyboardBLE.begin("openHARMONIE", "openHARMONIE", KeyboardLayout_en_US);
      continue;
    }
    Serial.println("KEY unknown");
  }
  delay(10);
}
