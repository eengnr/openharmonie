const { rules, triggers, items, actions, time } = require('openhab');
const { Gatekeeper } = require('openhab_rules_tools');

// Global and helper stuff

/**
 * Global variables
 */
const gkHARMONIE = Gatekeeper('openHARMONIE_change_activity'); // Gatekeeper which queues all commands and executes them one by one
const pauseBetweenCommands = 750; // Default pause between commands in milliseconds
let activityStarting = undefined; // Holds the currently starting activity
let previousActivity = undefined; // Holds the previous activity

/**
 * Helper function to add a command to the command list
 * @param {Object} item The item which should change its state
 * @param {string} targetState The target state
 * @param {number} [delay] The delay in ms to wait until the next command is executed
 */
const queueCommand = function (item, targetState, delay) {
  if (item && targetState) {
    const timeout = delay || pauseBetweenCommands;
    gkHARMONIE.addCommand(timeout, () => {
      item?.sendCommand(targetState);
    });
  } else {
    console.warn(`Item ${item} or targetState ${targetState} not found`);
  }
};

/**
 * Helper function to add a pause to the command list
 * @param {number} pause The pause in ms which should be added to the queue
 */
const queuePause = function (pause) {
  gkHARMONIE.addCommand(pause, () => {
    // Just wait
  });
};

/**
 * Helper function to start an activity with an optional task after an activity has started
 * @param {string} activity The activity that should be started
 * @param {function} [task] Optional task to perform after the activity was started, must be a function which is built from queueCommand/queuePause calls
 */
const startActivity = function (activity, task) {
  if (typeof task === 'function') {
    if (items.getItem('OPENHARMONIE_Activity_Starting')?.state == activity) {
      // If activity is already active, execute the task directly
      task();
    } else {
      // If activity is not active yet, add the task as onFinish phase and start the activity
      changeToActivity[getKey(activities, activity)].onFinish = task;
      items.getItem('OPENHARMONIE_Activity_Starting')?.sendCommand(activity);
    }
  } else if (task == undefined) {
    items.getItem('OPENHARMONIE_Activity_Starting')?.sendCommand(activity);
  } else {
    console.warn(`startActivity failed, task ${task} is not a function`);
  }
};

/**
 * Helper function to get the key of a specific value
 * @param {Object} object Object with key/value pairs
 * @param {string} value Value which should be checked
 * @returns {string} Key code which will be returned
 */
const getKey = function (object, value) {
  return Object.keys(object).find((key) => object[key] === value) || '';
};

// Remote control settings

/**
 * List of available remote controls including the physical/virtual openHARMONIE remote
 * For each remote control, the device and available commands are listed
 * The command keys are taken from the corresponding toml files or list of raw command files
 * The command values have to match the corresponding item metadata options
 */
const remotes = {
  OPENHARMONIE_RemoteControl: {
    device: 'OPENHARMONIE',
    commands: {
      // Hardware buttons available on physical remote used as 'openHARMONIE' remote
      OPENHARMONIE_POWER: '0',
      OPENHARMONIE_TV: '1',
      OPENHARMONIE_SUBTITLE: '2',
      OPENHARMONIE_TELETEXT: '3',
      OPENHARMONIE_SOURCE: '4',
      OPENHARMONIE_RED: '5',
      OPENHARMONIE_GREEN: '6',
      OPENHARMONIE_YELLOW: '7',
      OPENHARMONIE_BLUE: '8',
      OPENHARMONIE_GUIDE: '9',
      OPENHARMONIE_HOME: '10',
      OPENHARMONIE_OPTIONS: '11',
      OPENHARMONIE_UP: '12',
      OPENHARMONIE_DOWN: '13',
      OPENHARMONIE_LEFT: '14',
      OPENHARMONIE_RIGHT: '15',
      OPENHARMONIE_OK: '16',
      OPENHARMONIE_BACK: '17',
      OPENHARMONIE_INFO: '18',
      OPENHARMONIE_REWIND: '19',
      OPENHARMONIE_PAUSEPLAY: '20',
      OPENHARMONIE_FORWARD: '21',
      OPENHARMONIE_STOP: '22',
      OPENHARMONIE_RECORD: '23',
      OPENHARMONIE_VOLUMEUP: '24',
      OPENHARMONIE_VOLUMEDOWN: '25',
      OPENHARMONIE_MUTE: '26',
      OPENHARMONIE_CHANNELUP: '27',
      OPENHARMONIE_CHANNELDOWN: '28',
      OPENHARMONIE_FORMAT: '29',
      OPENHARMONIE_0: '30',
      OPENHARMONIE_1: '31',
      OPENHARMONIE_2: '32',
      OPENHARMONIE_3: '33',
      OPENHARMONIE_4: '34',
      OPENHARMONIE_5: '35',
      OPENHARMONIE_6: '36',
      OPENHARMONIE_7: '37',
      OPENHARMONIE_8: '38',
      OPENHARMONIE_9: '39',
      OPENHARMONIE_SOUND: '40',
      OPENHARMONIE_PICTURE: '41',
      OPENHARMONIE_PAUSE: '42',
      OPENHARMONIE_3D: '43',
      OPENHARMONIE_LIGHT: '44',
      OPENHARMONIE_SMARTTV: '45',
      OPENHARMONIE_LIST: '46',
      OPENHARMONIE_EXIT: '47',
      // Additional virtual buttons available from Sitemap
      OPENHARMONIE_SKIPNEXT: '100',
      OPENHARMONIE_SKIPBACK: '101',
      OPENHARMONIE_TOPMENU: '102',
      OPENHARMONIE_POPUPMENU: '103',
      OPENHARMONIE_RECORDINGS: '104',
      OPENHARMONIE_OPENCLOSE: '105',
      OPENHARMONIE_FIRETVTV: '106',
      OPENHARMONIE_APP_NETFLIX: '1000',
      OPENHARMONIE_APP_DISNEY: '1001',
      OPENHARMONIE_APP_JOYN: '1002',
      OPENHARMONIE_APP_RTLPLUS: '1003',
      OPENHARMONIE_APP_ZDF: '1004',
      OPENHARMONIE_APP_ARD: '1005',
      OPENHARMONIE_APP_NEWPIPE: '1006',
      OPENHARMONIE_APP_YOUTUBE: '1007',
      OPENHARMONIE_APP_AMAZONVIDEO: '1008',
      OPENHARMONIE_APP_AMAZONMUSIC: '1009',
      OPENHARMONIE_APP_APPLETV: '1010',
      OPENHARMONIE_APP_ARTE: '1011',
      OPENHARMONIE_APP_FREEVEE: '1012',
      OPENHARMONIE_TV_ARD: '2000',
      OPENHARMONIE_TV_ZDF: '2001',
      OPENHARMONIE_TV_BR: '2002',
      OPENHARMONIE_TV_RTL: '2003',
      OPENHARMONIE_TV_SAT1: '2004',
      OPENHARMONIE_TV_PRO7: '2005',
      OPENHARMONIE_TV_VOX: '2006',
      OPENHARMONIE_TV_RTL2: '2007',
      OPENHARMONIE_TV_NITRO: '2008',
      OPENHARMONIE_TV_TELE5: '2009',
    },
  },
  TV_HISENSE_EN2BF27H_RemoteControl: {
    device: 'TV_HISENSE_EN2BF27H',
    commands: {
      REMOTE_POWER: '0',
      REMOTE_INPUT: '1',
      REMOTE_1: '2',
      REMOTE_2: '3',
      REMOTE_3: '4',
      REMOTE_4: '5',
      REMOTE_5: '6',
      REMOTE_6: '7',
      REMOTE_7: '8',
      REMOTE_8: '9',
      REMOTE_9: '10',
      REMOTE_0: '11',
      REMOTE_GUIDE: '12',
      REMOTE_SUBTITLE: '13',
      REMOTE_RED: '14',
      REMOTE_GREEN: '15',
      REMOTE_YELLOW: '16',
      REMOTE_BLUE: '17',
      REMOTE_TEXT: '18',
      REMOTE_TXT: '19',
      REMOTE_UP: '20',
      REMOTE_LEFT: '21',
      REMOTE_RIGHT: '22',
      REMOTE_DOWN: '23',
      REMOTE_OK: '24',
      REMOTE_BACK: '25',
      REMOTE_EXIT: '26',
      REMOTE_HOME: '27',
      REMOTE_VOLUMEUP: '28',
      REMOTE_VOLUMEDOWN: '29',
      REMOTE_CHLIST: '30',
      REMOTE_MUTE: '31',
      REMOTE_CHANNELUP: '32',
      REMOTE_CHANNELDOWN: '33',
      REMOTE_REWIND: '34',
      REMOTE_PLAY: '35',
      REMOTE_FORWARD: '36',
      REMOTE_PAUSE: '37',
      REMOTE_AUDIOONLY: '38',
      REMOTE_STOP: '39',
      REMOTE_APPS: '40',
      REMOTE_YOUTUBE: '41',
      REMOTE_NETFLIX: '42',
      REMOTE_RAKUTENTV: '43',
    },
  },
  BLURAY_PLAYER_PIONEER_RemoteControl: {
    device: 'BLURAY_PLAYER_PIONEER',
    commands: {
      REMOTE_POWER: '0',
      REMOTE_FUNCTION: '1',
      REMOTE_OPENCLOSE: '2',
      REMOTE_HOMEMEDIAGALLERY: '3',
      REMOTE_RESOLUTION: '4',
      REMOTE_NETCONTENTS: '5',
      REMOTE_KEYLOCK: '6',
      REMOTE_KARAOKE: '7',
      REMOTE_MICVOLUMEUP: '8',
      REMOTE_DIMMER: '9',
      REMOTE_SLEEP: '10',
      REMOTE_EXIT: '11',
      REMOTE_MICVOLUMEDOWN: '12',
      REMOTE_VIRTUALSOUND: '13',
      REMOTE_SOUND: '14',
      REMOTE_VOLUMEUP: '15',
      REMOTE_SOUNDRETRIEVER: '16',
      REMOTE_CDSACD: '17',
      REMOTE_VOLUMEDOWN: '18',
      REMOTE_USBREC: '19',
      REMOTE_DISPLAY: '20',
      REMOTE_MUTE: '21',
      REMOTE_TOPMENU: '22',
      REMOTE_POPUPMENU: '23',
      REMOTE_UP: '24',
      REMOTE_LEFT: '25',
      REMOTE_RIGHT: '26',
      REMOTE_DOWN: '27',
      REMOTE_ENTER: '28',
      REMOTE_HOMEMENU: '29',
      REMOTE_RETURN: '30',
      REMOTE_REPLAY: '31',
      REMOTE_TOOLS: '32',
      REMOTE_CONTINUED: '33',
      REMOTE_SKIPSEARCH: '34',
      REMOTE_REWIND: '35',
      REMOTE_PLAY: '36',
      REMOTE_FORWARD: '37',
      REMOTE_SKIPBACK: '38',
      REMOTE_PAUSE: '39',
      REMOTE_STOP: '40',
      REMOTE_SKIPNEXT: '41',
      REMOTE_1: '42',
      REMOTE_2: '43',
      REMOTE_3: '44',
      REMOTE_4: '45',
      REMOTE_5: '46',
      REMOTE_6: '47',
      REMOTE_7: '48',
      REMOTE_8: '49',
      REMOTE_9: '50',
      REMOTE_0: '51',
      REMOTE_AUDIO: '52',
      REMOTE_SUBTITLE: '53',
      REMOTE_ANGLE: '54',
      REMOTE_CLEAR: '55',
      REMOTE_REPEAT: '56',
      REMOTE_AB: '57',
      REMOTE_PROGRAM: '58',
      REMOTE_BOOKMARK: '59',
      REMOTE_ZOOM: '60',
      REMOTE_INDEX: '61',
      REMOTE_TV_POWER2: '62',
      REMOTE_TV_CHANNELUP: '63',
      REMOTE_TV_VOLUMEUP: '64',
      REMOTE_TV_INPUT: '65',
      REMOTE_TV_CHANNELDOWN: '66',
      REMOTE_TV_VOLUMEDOWN: '67',
    },
  },
  RECEIVER_SAMSUNG_KD_RemoteControl: {
    device: 'RECEIVER_SAMSUNG_KD',
    commands: {
      REMOTE_0: '0',
      REMOTE_1: '1',
      REMOTE_2: '2',
      REMOTE_3: '3',
      REMOTE_4: '4',
      REMOTE_5: '5',
      REMOTE_6: '6',
      REMOTE_7: '7',
      REMOTE_8: '8',
      REMOTE_9: '9',
      REMOTE_AUFNAHMEN: '10',
      REMOTE_BACK: '11',
      REMOTE_BLUE: '12',
      REMOTE_CHANNELDOWN: '13',
      REMOTE_CHANNELUP: '14',
      REMOTE_DOWN: '15',
      REMOTE_EXIT: '16',
      REMOTE_FORWARD: '17',
      REMOTE_GREEN: '18',
      REMOTE_INFO: '19',
      REMOTE_LEFT: '20',
      REMOTE_MENU: '21',
      REMOTE_MUTE: '22',
      REMOTE_OK: '23',
      REMOTE_OPT: '24',
      REMOTE_PAUSEPLAY: '25',
      REMOTE_POWER: '26',
      REMOTE_PROGRAMM: '27',
      REMOTE_REC: '28',
      REMOTE_RED: '29',
      REMOTE_REWIND: '30',
      REMOTE_RIGHT: '31',
      REMOTE_SELECTVIDEO: '32',
      REMOTE_STOP: '33',
      REMOTE_SUCHE: '34',
      REMOTE_TEXT: '35',
      REMOTE_TVRADIO: '36',
      REMOTE_TV: '37',
      REMOTE_UP: '38',
      REMOTE_VOLUMEDOWN: '39',
      REMOTE_VOLUMEUP: '40',
      REMOTE_YELLOW: '41',
    },
  },
  FIRETV_RemoteControl: {
    device: 'FIRETV',
    commands: {
      // Buttons on Fire TV remote
      KEY_POWER: '116',
      KEY_SEARCH: '217',
      KEY_LEFT: '105',
      KEY_UP: '103',
      KEY_RIGHT: '106',
      KEY_DOWN: '108',
      KEY_KPENTER: '96',
      KEY_BACK: '158',
      KEY_HOMEPAGE: '172',
      KEY_MENU: '139',
      KEY_REWIND: '168',
      KEY_PLAYPAUSE: '164',
      KEY_FASTFORWARD: '208',
      KEY_MUTE: '113',
      KEY_VOLUMEUP: '115',
      KEY_VOLUMEDOWN: '114',
      KEY_PROGRAM: '362', // does not work
      // Virtual additional buttons
      KEY_CHANNELUP: '402',
      KEY_CHANNELDOWN: '403',
      REMOTE_APP_NETFLIX: '1000',
      REMOTE_APP_DISNEY: '1001',
      REMOTE_APP_JOYN: '1002',
      REMOTE_APP_RTLPLUS: '1003',
      REMOTE_APP_ZDF: '1004',
      REMOTE_APP_ARD: '1005',
      REMOTE_APP_NEWPIPE: '1006',
      REMOTE_APP_YOUTUBE: '1007',
      REMOTE_APP_AMAZONVIDEO: '1008',
      REMOTE_APP_AMAZONMUSIC: '1009',
      REMOTE_APP_APPLETV: '1010',
      REMOTE_APP_ARTE: '1011',
      REMOTE_APP_FREEVEE: '1012',
      REMOTE_CONNECT: '2000',
      REMOTE_DISCONNECT: '2001',
    },
  },
  HDMI_SWITCH_3_RemoteControl: {
    device: 'HDMI_SWITCH_3',
    commands: {
      REMOTE_1: '0',
      REMOTE_2: '1',
      REMOTE_3: '2',
      REMOTE_POWER: '3',
      REMOTE_PREVIOUS: '4',
      REMOTE_NEXT: '5',
    },
  },
  HDMI_SWITCH_5_RemoteControl: {
    device: 'HDMI_SWITCH_5',
    commands: {
      REMOTE_1: '0',
      REMOTE_2: '1',
      REMOTE_3: '2',
      REMOTE_4: '3',
      REMOTE_5: '4',
    },
  },
};

// Send out or receive commands via MQTT

/**
 * Rule to update MQTT item to publish a command via MQTT
 * When a button on a remote control item is pushed, we use this rule
 */
rules.JSRule({
  name: 'Remote_Control_Button_Pushed',
  triggers: [
    triggers.ItemStateUpdateTrigger('TV_HISENSE_EN2BF27H_RemoteControl'),
    triggers.ItemStateUpdateTrigger('BLURAY_PLAYER_PIONEER_RemoteControl'),
    triggers.ItemStateUpdateTrigger('RECEIVER_SAMSUNG_KD_RemoteControl'),
    triggers.ItemStateUpdateTrigger('HDMI_SWITCH_3_RemoteControl'),
    triggers.ItemStateUpdateTrigger('HDMI_SWITCH_5_RemoteControl'),
    triggers.ItemStateUpdateTrigger('FIRETV_RemoteControl'),
    // Add other remote control items
    // TODO make dynamic based on type instead of item name
  ],
  execute: (event) => {
    // Get device for remote control
    const device = remotes[event.itemName].device;
    // Get command name from receivedState number
    const commandToSend = getKey(remotes[event.itemName].commands, event.receivedState);
    // If command was found, update MQTT item
    if (commandToSend != '' && commandToSend != undefined) {
      console.debug(`Sending ${commandToSend} to ${device}`);
      items.getItem('Send_Harmonie_Command')?.sendCommand(`${device} ${commandToSend}`); // Format is parsed on Pi 0 W side in send_command.sh
    } else {
      console.warn('commandToSend not found');
    }
  },
});

/**
 * Rule to forward a received IR command from the MQTT topic to the openHARMONIE remote control item (= "push button on openHARMONIE")
 * This is used to process IR commands from the additional physical remote
 * A number is sent as update to the item
 */
rules.JSRule({
  name: 'IR_Command_Received_Via_MQTT',
  triggers: [triggers.ItemStateUpdateTrigger('Receive_Harmonie_Command')],
  execute: (event) => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl'].commands[event.receivedState]);
  },
});

// Change power and input states of real devices

/**
 * Rule to change power state items of physical devices
 * Triggered only on changes
 */
rules.JSRule({
  name: 'Device_Power_Pushed',
  triggers: [
    triggers.ItemStateChangeTrigger('TV_HISENSE_EN2BF27H_OnOff'),
    triggers.ItemStateChangeTrigger('BLURAY_PLAYER_PIONEER_OnOff'),
    triggers.ItemStateChangeTrigger('RECEIVER_SAMSUNG_KD_OnOff'),
    // Add other power state Switch items
    // TODO make dynamic based on type instead of item name
  ],
  execute: (event) => {
    switch (event.itemName) {
      case 'TV_HISENSE_EN2BF27H_OnOff':
        items
          .getItem('TV_HISENSE_EN2BF27H_RemoteControl')
          ?.sendCommand(remotes['TV_HISENSE_EN2BF27H_RemoteControl'].commands['REMOTE_POWER']);
        break;
      case 'BLURAY_PLAYER_PIONEER_OnOff':
        items
          .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
          ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_POWER']);
        break;
      case 'RECEIVER_SAMSUNG_KD_OnOff':
        items
          .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
          ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_POWER']);
        break;
    }
  },
});

/**
 * Mapping of input names to numbers
 */
const inputs = {
  BLURAY_PLAYER_PIONEER_Input: {
    FM: '0',
    BLUETOOTH: '1',
    AUX: '2',
    PORTABLE: '3',
    ARC: '4',
    OPTICAL1: '5',
    OPTICAL2: '6',
    HDMI1: '7',
    HDMI2: '8',
  },
  HDMI_SWITCH_3_Input: { HDMI1: '0', HDMI2: '1', HDMI3: '2' },
  HDMI_SWITCH_5_Input: { HDMI1: '0', HDMI2: '1', HDMI3: '2', HDMI4: '3', HDMI5: '4' },
};

/**
 * Rule to change input source items of physical devices
 * Triggered even if same input is selected
 */
rules.JSRule({
  name: 'Device_Input_Pushed',
  triggers: [
    triggers.ItemStateUpdateTrigger('BLURAY_PLAYER_PIONEER_Input'),
    triggers.ItemStateUpdateTrigger('HDMI_SWITCH_3_Input'),
    triggers.ItemStateUpdateTrigger('HDMI_SWITCH_5_Input'),
    // Add other input source Number items
    // TODO make dynamic based on type instead of item name
  ],
  execute: (event) => {
    const input = event.receivedState;
    switch (event.itemName) {
      case 'HDMI_SWITCH_3_Input':
        items.getItem('HDMI_SWITCH_3_RemoteControl')?.sendCommand(input); // Possible, because input 0 = button 0 and so on
        break;
      case 'HDMI_SWITCH_5_Input':
        items.getItem('HDMI_SWITCH_5_RemoteControl')?.sendCommand(input); // Possible, because input 0 = button 0 and so on
        break;
      case 'Bluray_Player_Input_Source':
        // To change input source on Bluray player, you have to push 'Function', followed by 'Right' x times and then 'OK'
        const rightPushes = parseInt(event.receivedState);
        // Send 'Function' command and wait:
        queueCommand(
          items.getItem('BLURAY_PLAYER_PIONEER_RemoteControl'),
          remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_FUNCTION'],
          1000
        );
        // Push x times 'Right' depending on the input source and wait
        for (let i = 0; i < rightPushes; i++) {
          queueCommand(
            items.getItem('BLURAY_PLAYER_PIONEER_RemoteControl'),
            remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_RIGHT'],
            1000
          );
        }
        // Push 'OK'
        queueCommand(
          items.getItem('BLURAY_PLAYER_PIONEER_RemoteControl'),
          remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_OK']
        );
      // ...
    }
  },
});

// openHARMONIE implementation

/**
 * List of available activities
 */
const activities = {
  PowerOff: '0',
  TV: '1',
  FireTV: '2',
  Chromecast: '3',
  Film: '4',
  Wii: '5',
  HDMI: '6',
};

/**
 * Map of necessary settings (power states, input states, ...) for each activity
 * Starting an activity has different phases:
 * - Phase 0: onExit - commands that are executed if the activity ends
 * - Phase 1: powerStates - commands that are executed to set the correct power states of the devices for the starting activity
 * - Phase 2: inputStates - commands that are executed to set the correct input states
 * - Phase 3: onEnter - commands that are executed additionally to start the new activity
 * - Phase 4: onFinish - optional commands which can be dynamically changed depending e.g. on starting a favourite channel
 * Every command of a phase needs to be added to the global Gatekeeper with the queueCommand/queuePause helper
 * Timing of commands after power on commands needs to be fine tuned to allow the target device to fully boot up and be able to receive further commands
 */
const changeToActivity = {
  PowerOff: {
    powerStates: () => {
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'OFF');
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'OFF');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
    },
    inputStates: () => {},
    onEnter: () => {},
    onFinish: () => {},
    onExit: () => {},
  },
  TV: {
    powerStates: () => {
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'ON');
    },
    inputStates: () => {
      queuePause(2000);
      if (previousActivity == activities['PowerOff']) {
        queuePause(6000); // Wait for Chromecast (powered on with the whole system) to send HDMI signal to Switch 3, then change input afterwards
      }
      queueCommand(items.getItem('HDMI_SWITCH_3_Input'), inputs['HDMI_SWITCH_3_Input']['HDMI1'], 1000);
      queueCommand(items.getItem('HDMI_SWITCH_5_Input'), inputs['HDMI_SWITCH_5_Input']['HDMI2']);
    },
    onEnter: () => {
      // Cable receiver is in sleep state until 18:30 and takes very long to start up - add a pause in this case
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      if (hour < 18 || (hour == 18 && minutes < 30)) {
        queuePause(100 * 1000); // 1:40 minutes
      } else {
        queuePause(2000);
      }
    },
    onFinish: () => {},
    onExit: () => {},
  },
  FireTV: {
    powerStates: () => {
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
    },
    inputStates: () => {
      if (previousActivity == activities['PowerOff']) {
        queuePause(4000);
      }
      queueCommand(items.getItem('HDMI_SWITCH_5_Input'), inputs['HDMI_SWITCH_5_Input']['HDMI1']);
    },
    onEnter: () => {
      // Establish ADB connection, this can take a few seconds to start the daemon
      queueCommand(
        items.getItem('FIRETV_RemoteControl'),
        remotes['FIRETV_RemoteControl'].commands['REMOTE_CONNECT'],
        4000
      );
      // Press menu button of FireTV
      if (previousActivity == activities['PowerOff']) {
        queuePause(2000);
      }
      queueCommand(
        items.getItem('FIRETV_RemoteControl'),
        remotes['FIRETV_RemoteControl'].commands['KEY_HOMEPAGE'],
        1000
      );
      // Workaround for input keyevent
      queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['KEY_BACK'], 1000);
      queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['KEY_HOMEPAGE']);
    },
    onFinish: () => {},
    onExit: () => {
      // Press menu button of FireTV
      queueCommand(
        items.getItem('FIRETV_RemoteControl'),
        remotes['FIRETV_RemoteControl'].commands['KEY_HOMEPAGE'],
        1000
      );
      // Disconnect ADB
      queueCommand(
        items.getItem('FIRETV_RemoteControl'),
        remotes['FIRETV_RemoteControl'].commands['REMOTE_DISCONNECT']
      );
    },
  },
  Chromecast: {
    powerStates: () => {
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
    },
    inputStates: () => {
      if (previousActivity == activities['PowerOff']) {
        queuePause(4000);
      }
      queueCommand(items.getItem('HDMI_SWITCH_3_Input'), inputs['HDMI_SWITCH_3_Input']['HDMI3'], 1000);
      queueCommand(items.getItem('HDMI_SWITCH_5_Input'), inputs['HDMI_SWITCH_5_Input']['HDMI2']);
    },
    onEnter: () => {},
    onExit: () => {},
    onFinish: () => {},
  },
  Film: {
    powerStates: () => {
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
    },
    inputStates: () => {},
    onEnter: () => {
      queueCommand(
        items.getItem('BLURAY_PLAYER_PIONEER_RemoteControl'),
        remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_HOMEMENU']
      );
    },
    onFinish: () => {},
    onExit: () => {
      // Switch input back to HDMI 1
      // TODO Refactor call; we don't need a queueCommand here, because the input change internally queues commands
      // Queue in queue leads to wrong order, commands are at the end of queue instead of the middle
      // But it would be better if the onExit consists of queueCommand/queuePause calls
      items.getItem('BLURAY_PLAYER_PIONEER_Input')?.sendCommand(inputs['BLURAY_PLAYER_PIONEER_Input']['HDMI1']);
    },
  },
  Wii: {
    powerStates: () => {
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
    },
    inputStates: () => {
      if (previousActivity == activities['PowerOff']) {
        queuePause(4000);
      }
      queueCommand(items.getItem('HDMI_SWITCH_5_Input'), inputs['HDMI_SWITCH_5_Input']['HDMI5']);
    },
    onEnter: () => {},
    onFinish: () => {},
    onExit: () => {},
  },
  HDMI: {
    powerStates: () => {
      queueCommand(items.getItem('TV_HISENSE_EN2BF27H_OnOff'), 'ON');
      queueCommand(items.getItem('RECEIVER_SAMSUNG_KD_OnOff'), 'OFF');
      queueCommand(items.getItem('BLURAY_PLAYER_PIONEER_OnOff'), 'ON');
    },
    inputStates: () => {
      if (previousActivity == activities['PowerOff']) {
        queuePause(4000);
      }
      queueCommand(items.getItem('HDMI_SWITCH_5_Input'), inputs['HDMI_SWITCH_5_Input']['HDMI4']);
    },
    onEnter: () => {},
    onFinish: () => {},
    onExit: () => {},
  },
};

/**
 * Mapping of openHARMONIE remote control commands to real devices (or other stuff) depending on the current activity.
 * If a command is not listed in the activity specific section, it can be added in the default section for all activities.
 * Activity specific commands overwrite the default behavior.
 * If only simple button pushes are mapped, no Gatekeeper is necessary. If multiple button presses are mapped to one
 * openHARMONIE command, they have to be queued with queueCommand/queuePause.
 * If it's necessary to start an activity first and then execute additional button presses (e.g. to start a favorite TV channel)
 * use the startActivity helper. This will take care of starting the activity if necessary and then execute the task.
 */
const activityCommands = {
  PowerOff: {
    OPENHARMONIE_POWER: () => {
      if (previousActivity != undefined) {
        startActivity(previousActivity);
      }
    },
  },
  TV: {
    OPENHARMONIE_GUIDE: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_PROGRAMM']);
    },
    OPENHARMONIE_OPTIONS: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_OPT']);
    },
    OPENHARMONIE_BACK: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_BACK']);
    },
    OPENHARMONIE_EXIT: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_EXIT']);
    },
    OPENHARMONIE_INFO: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_INFO']);
    },
    OPENHARMONIE_SMARTTV: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_SUCHE']);
    },
    // Button on physical remote
    OPENHARMONIE_LIST: () => {
      items
        .getItem('OPENHARMONIE_RemoteControl')
        ?.sendCommand(remotes['OPENHARMONIE_RemoteControl'].commands['OPENHARMONIE_RECORDINGS']);
    },
    // Button in sitemap
    OPENHARMONIE_RECORDINGS: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_AUFNAHMEN']);
    },
    OPENHARMONIE_REWIND: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_REWIND']);
    },
    OPENHARMONIE_PAUSEPLAY: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_PAUSEPLAY']);
    },
    OPENHARMONIE_PAUSE: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_PAUSEPLAY']);
    },
    OPENHARMONIE_FORWARD: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_FORWARD']);
    },
    OPENHARMONIE_STOP: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_STOP']);
    },
    OPENHARMONIE_RECORD: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_REC']);
    },
    OPENHARMONIE_UP: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_UP']);
    },
    OPENHARMONIE_DOWN: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_DOWN']);
    },
    OPENHARMONIE_LEFT: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_LEFT']);
    },
    OPENHARMONIE_RIGHT: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_RIGHT']);
    },
    OPENHARMONIE_OK: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_OK']);
    },
    OPENHARMONIE_0: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_0']);
    },
    OPENHARMONIE_1: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_1']);
    },
    OPENHARMONIE_2: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_2']);
    },
    OPENHARMONIE_3: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_3']);
    },
    OPENHARMONIE_4: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_4']);
    },
    OPENHARMONIE_5: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_5']);
    },
    OPENHARMONIE_6: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_6']);
    },
    OPENHARMONIE_7: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_7']);
    },
    OPENHARMONIE_8: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_8']);
    },
    OPENHARMONIE_9: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_9']);
    },
    OPENHARMONIE_CHANNELUP: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_CHANNELUP']);
    },
    OPENHARMONIE_CHANNELDOWN: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_CHANNELDOWN']);
    },
    OPENHARMONIE_HOME: () => {
      items
        .getItem('RECEIVER_SAMSUNG_KD_RemoteControl')
        ?.sendCommand(remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_MENU']);
    },
  },
  FireTV: {
    OPENHARMONIE_UP: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_UP']);
    },
    OPENHARMONIE_DOWN: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_DOWN']);
    },
    OPENHARMONIE_LEFT: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_LEFT']);
    },
    OPENHARMONIE_RIGHT: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_RIGHT']);
    },
    OPENHARMONIE_OK: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_KPENTER']);
    },
    OPENHARMONIE_HOME: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_HOMEPAGE']);
    },
    OPENHARMONIE_PAUSEPLAY: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_PLAYPAUSE']);
    },
    OPENHARMONIE_PAUSE: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_PLAYPAUSE']);
    },
    OPENHARMONIE_BACK: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_BACK']);
    },
    OPENHARMONIE_FORWARD: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_FASTFORWARD']);
    },
    OPENHARMONIE_REWIND: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_REWIND']);
    },
    OPENHARMONIE_CHANNELUP: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_CHANNELUP']);
    },
    OPENHARMONIE_CHANNELDOWN: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_CHANNELDOWN']);
    },
    OPENHARMONIE_1: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_ARD']);
    },
    OPENHARMONIE_2: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_ZDF']);
    },
    OPENHARMONIE_3: () => {
      items
        .getItem('FIRETV_RemoteControl')
        ?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_RTLPLUS']);
    },
    OPENHARMONIE_4: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_JOYN']);
    },
    OPENHARMONIE_5: () => {
      items
        .getItem('FIRETV_RemoteControl')
        ?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_NETFLIX']);
    },
    OPENHARMONIE_6: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_DISNEY']);
    },
    OPENHARMONIE_7: () => {
      items
        .getItem('FIRETV_RemoteControl')
        ?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_AMAZONVIDEO']);
    },
    OPENHARMONIE_8: () => {
      items
        .getItem('FIRETV_RemoteControl')
        ?.sendCommand(remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_NEWPIPE']);
    },
    OPENHARMONIE_SMARTTV: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_SEARCH']);
    },
    OPENHARMONIE_OPTIONS: () => {
      items.getItem('FIRETV_RemoteControl')?.sendCommand(remotes['FIRETV_RemoteControl'].commands['KEY_MENU']);
    },
  },
  Chromecast: {},
  Film: {
    OPENHARMONIE_UP: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_UP']);
    },
    OPENHARMONIE_DOWN: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_DOWN']);
    },
    OPENHARMONIE_LEFT: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_LEFT']);
    },
    OPENHARMONIE_RIGHT: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_RIGHT']);
    },
    OPENHARMONIE_OK: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_ENTER']);
    },
    OPENHARMONIE_HOME: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_HOMEMENU']);
    },
    OPENHARMONIE_BACK: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_RETURN']);
    },
    OPENHARMONIE_PAUSEPLAY: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_PLAY']);
    },
    OPENHARMONIE_PAUSE: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_PAUSE']);
    },
    OPENHARMONIE_SKIPNEXT: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_SKIPNEXT']);
    },
    OPENHARMONIE_SKIPBACK: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_SKIPBACK']);
    },
    // Virtual
    OPENHARMONIE_OPENCLOSE: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_OPENCLOSE']);
    },
    OPENHARMONIE_TOPMENU: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_TOPMENU']);
    },
    OPENHARMONIE_POPUPMENU: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_POPUPMENU']);
    },
    // Physical
    OPENHARMONIE_GUIDE: () => {
      items
        .getItem('OPENHARMONIE_RemoteControl')
        ?.sendCommand(remotes['OPENHARMONIE_RemoteControl'].commands['OPENHARMONIE_OPENCLOSE']);
    },
    OPENHARMONIE_LIST: () => {
      items
        .getItem('OPENHARMONIE_RemoteControl')
        ?.sendCommand(remotes['OPENHARMONIE_RemoteControl'].commands['OPENHARMONIE_TOPMENU']);
    },
    OPENHARMONIE_OPTIONS: () => {
      items
        .getItem('OPENHARMONIE_RemoteControl')
        ?.sendCommand(remotes['OPENHARMONIE_RemoteControl'].commands['OPENHARMONIE_POPUPMENU']);
    },
  },
  Wii: {},
  HDMI: {},
  default: {
    OPENHARMONIE_POWER: () => {
      startActivity(activities['PowerOff']);
    },
    OPENHARMONIE_TV: () => {
      startActivity(activities['TV']);
    },
    OPENHARMONIE_RED: () => {
      startActivity(activities['FireTV']);
    },
    OPENHARMONIE_GREEN: () => {
      startActivity(activities['Chromecast']);
    },
    OPENHARMONIE_YELLOW: () => {
      startActivity(activities['Wii']);
    },
    OPENHARMONIE_BLUE: () => {
      startActivity(activities['Film']);
    },
    OPENHARMONIE_SOURCE: () => {
      startActivity(activities['HDMI']);
    },
    OPENHARMONIE_VOLUMEUP: () => {
      // Could also be used to e.g. change the volume of an Echo device with the Echo Binding
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_VOLUMEUP']);
    },
    OPENHARMONIE_VOLUMEDOWN: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_VOLUMEDOWN']);
    },
    OPENHARMONIE_MUTE: () => {
      items
        .getItem('BLURAY_PLAYER_PIONEER_RemoteControl')
        ?.sendCommand(remotes['BLURAY_PLAYER_PIONEER_RemoteControl'].commands['REMOTE_MUTE']);
    },
    OPENHARMONIE_TV_ARD: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_1']
        );
      });
    },
    OPENHARMONIE_TV_ZDF: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_2']
        );
      });
    },
    OPENHARMONIE_TV_BR: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_2']
        );
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_8']
        );
      });
    },
    OPENHARMONIE_TV_RTL: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_3']
        );
      });
    },
    OPENHARMONIE_TV_SAT1: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_4']
        );
      });
    },
    OPENHARMONIE_TV_PRO7: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_5']
        );
      });
    },
    OPENHARMONIE_TV_VOX: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_6']
        );
      });
    },
    OPENHARMONIE_TV_RTL2: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_7']
        );
      });
    },
    OPENHARMONIE_TV_NITRO: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_1']
        );
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_4']
        );
      });
    },
    OPENHARMONIE_TV_TELE5: () => {
      startActivity(activities['TV'], () => {
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_1']
        );
        queueCommand(
          items.getItem('RECEIVER_SAMSUNG_KD_RemoteControl'),
          remotes['RECEIVER_SAMSUNG_KD_RemoteControl'].commands['REMOTE_8']
        );
      });
    },
    OPENHARMONIE_APP_NETFLIX: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_NETFLIX']
        );
      });
    },
    OPENHARMONIE_APP_DISNEY: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_DISNEY']
        );
      });
    },
    OPENHARMONIE_APP_RTLPLUS: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_RTLPLUS']
        );
      });
    },
    OPENHARMONIE_APP_JOYN: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_JOYN']
        );
      });
    },
    OPENHARMONIE_APP_ZDF: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_ZDF']);
      });
    },
    OPENHARMONIE_APP_ARD: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_ARD']);
      });
    },
    OPENHARMONIE_APP_NEWPIPE: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_NEWPIPE']
        );
      });
    },
    OPENHARMONIE_APP_YOUTUBE: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_YOUTUBE']
        );
      });
    },
    OPENHARMONIE_APP_AMAZONVIDEO: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_AMAZONVIDEO']
        );
      });
    },
    OPENHARMONIE_APP_AMAZONMUSIC: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_AMAZONMUSIC']
        );
      });
    },
    OPENHARMONIE_APP_APPLETV: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_APPLETV']
        );
      });
    },
    OPENHARMONIE_APP_ARTE: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_ARTE']
        );
      });
    },
    OPENHARMONIE_APP_FREEVEE: () => {
      startActivity(activities['FireTV'], () => {
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['REMOTE_APP_FREEVEE']
        );
      });
    },
    OPENHARMONIE_FIRETVTV: () => {
      startActivity(activities['FireTV'], () => {
        // Workaround, KEY_PROGRAM does not work and 'adb shell' does not have the rights to start the com.amazon.tv.livetv./GuideWrapperActivity
        //queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['KEY_PROGRAM']);
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['KEY_HOMEPAGE'],
          3000
        );
        queueCommand(
          items.getItem('FIRETV_RemoteControl'),
          remotes['FIRETV_RemoteControl'].commands['KEY_RIGHT'],
          1500
        );
        queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['KEY_DOWN'], 1500);
        queueCommand(items.getItem('FIRETV_RemoteControl'), remotes['FIRETV_RemoteControl'].commands['KEY_KPENTER']);
      });
    },
    OPENHARMONIE_LIGHT: () => {
      // Handled in cinemalight.js
    },
  },
};

/**
 * Rule to send mapped IR command to the real device if the button on the openHARMONIE is pushed
 * A number is received as update and needs to be mapped to the outgoing command
 * Updates can either be received from the 'Receive_Harmonie_Command' MQTT item or from the web/app UI
 */
rules.JSRule({
  name: 'openHARMONIE_Button_Pushed',
  triggers: [triggers.ItemStateUpdateTrigger('OPENHARMONIE_RemoteControl')],
  execute: (event) => {
    // Ignore additional commands as long as activity is starting
    if (!activityStarting) {
      const command = getKey(remotes['OPENHARMONIE_RemoteControl'].commands, event.receivedState);
      const currentActivity = getKey(
        activities,
        Math.floor(items.getItem('OPENHARMONIE_Activity_Started')?.numericState || 0).toString()
      ); // Workaround if value is e.g. 0.0 after openHAB restart
      if (activityCommands[currentActivity]?.[command]) {
        activityCommands[currentActivity][command]();
      } else if (activityCommands['default'][command]) {
        activityCommands['default'][command]();
      } else {
        console.info(`No button mapping found for ${command} and activity ${currentActivity}`);
      }
    } else {
      console.info(`Activity ${getKey(activities, activityStarting)} is currently starting, button press ignored`);
    }
  },
});

/**
 * Rule to start an activity
 * The 'starting' item is set immediately, then all necessary commands are sent
 * The 'started' item is set after all commands were sent
 * While the activity starts, the activityStarting variable holds the new activity
 */
rules.JSRule({
  name: 'openHARMONIE_Activity_Starting',
  triggers: [triggers.ItemStateChangeTrigger('OPENHARMONIE_Activity_Starting')],
  execute: (event) => {
    const newActivity = event.newState;
    if (activityStarting != undefined) {
      // If an activity is already starting, don't start the new one
      // TODO: check if this is necessary or if it is better to cancel all queued commands and just restart
      console.info(`Activity ${getKey(activities, activityStarting)} is already starting, no change possible...`);
      // Reset the starting item to the currently starting activity
      items.getItem('OPENHARMONIE_Activity_Starting')?.sendCommand(activityStarting);
    } else {
      // Start activity and persist previous activity
      gkHARMONIE.addCommand(pauseBetweenCommands, () => {
        console.info(`Starting ${getKey(activities, newActivity)}...`);
        // Persist current activity as previous activity and start the change
        activityStarting = newActivity;
        previousActivity = Math.floor(items.getItem('OPENHARMONIE_Activity_Started')?.numericState || 0).toString(); // Workaround if value is e.g. 0.0 after openHAB restart
      });
      // PHASE 0
      // Execute exit commands of previous activity with info about new activity
      if (typeof changeToActivity[getKey(activities, previousActivity)]?.onExit === 'function') {
        changeToActivity[getKey(activities, previousActivity)].onExit();
      }
      // PHASE 1 + 2
      if (
        typeof changeToActivity[getKey(activities, newActivity)]?.powerStates === 'function' &&
        typeof changeToActivity[getKey(activities, newActivity)]?.inputStates === 'function'
      ) {
        // Change power states of devices to new activity with info about previous activity
        changeToActivity[getKey(activities, newActivity)].powerStates();
        // Change input states of devices to new activity with info about previous activity
        changeToActivity[getKey(activities, newActivity)].inputStates();
      }
      // Update item for started activity (= current activity)
      gkHARMONIE.addCommand(0, () => {
        items.getItem('OPENHARMONIE_Activity_Started')?.sendCommand(newActivity);
      });
      // PHASE 3
      // Execute additional commands for new activity with info about previous activity
      // and and reset starting flag
      if (typeof changeToActivity[getKey(activities, newActivity)]?.onEnter === 'function') {
        changeToActivity[getKey(activities, newActivity)].onEnter();
      }
      gkHARMONIE.addCommand(500, () => {
        activityStarting = undefined;
        console.info(`${getKey(activities, newActivity)} started.`);
      });
      // PHASE 4
      // Execute additional commands after the activity has started
      if (typeof changeToActivity[getKey(activities, newActivity)]?.onFinish === 'function') {
        changeToActivity[getKey(activities, newActivity)].onFinish();
        // Clear the additional task
        gkHARMONIE.addCommand(0, () => {
          changeToActivity[getKey(activities, newActivity)].onFinish = () => {};
        });
      }
    }
  },
});

/**
 * Voice command actions
 */
const voiceCommands = {
  openHARMONIE_AVC_Activity_TV: () => {
    startActivity(activities['TV']);
  },
  openHARMONIE_AVC_Activity_FireTV: () => {
    startActivity(activities['FireTV']);
  },
  openHARMONIE_AVC_Activity_Chromecast: () => {
    startActivity(activities['Chromecast']);
  },
  openHARMONIE_AVC_Activity_Film: () => {
    startActivity(activities['Film']);
  },
  openHARMONIE_AVC_Activity_Wii: () => {
    startActivity(activities['Wii']);
  },
  openHARMONIE_AVC_Activity_HDMI: () => {
    startActivity(activities['HDMI']);
  },
  openHARMONIE_AVC_Button_Pause: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_PAUSE']);
  },
  openHARMONIE_AVC_Button_Play: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_PAUSEPLAY']);
  },
  openHARMONIE_AVC_Button_VolUp: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_VOLUMEUP']);
  },
  openHARMONIE_AVC_Button_VolDown: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_VOLUMEDOWN']);
  },
  openHARMONIE_AVC_Favorite_DasErste: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_ARD']);
  },
  openHARMONIE_AVC_Favorite_ZDF: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_ZDF']);
  },
  openHARMONIE_AVC_Favorite_BR: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_BR']);
  },
  openHARMONIE_AVC_Favorite_RTL: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_RTL']);
  },
  openHARMONIE_AVC_Favorite_Sat1: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_SAT1']);
  },
  openHARMONIE_AVC_Favorite_ProSieben: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_TV_PRO7']);
  },
  openHARMONIE_AVC_Favorite_RTLPlus: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_APP_RTLPLUS']);
  },
  openHARMONIE_AVC_Favorite_Netflix: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_APP_NETFLIX']);
  },
  openHARMONIE_AVC_Favorite_Disney: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_APP_DISNEY']);
  },
  openHARMONIE_AVC_Favorite_Joyn: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_APP_JOYN']);
  },
  openHARMONIE_AVC_Favorite_AmazonVideo: () => {
    items
      .getItem('OPENHARMONIE_RemoteControl')
      ?.sendCommand(remotes['OPENHARMONIE_RemoteControl']?.commands['OPENHARMONIE_APP_AMAZONVIDEO']);
  },
};

/**
 * Rule to start or stop activities with voice commands
 * State Update trigger, because switches stay on/off
 */
rules.JSRule({
  name: 'openHARMONIE_Voice_Commands',
  triggers: [triggers.GroupStateUpdateTrigger('openHARMONIE_AVC_Group')],
  execute: (event) => {
    if (event.receivedState == 'ON') {
      const itemName = event.itemName;
      if (typeof voiceCommands[itemName] === 'function') {
        voiceCommands[itemName]();
      }
    }
    if (
      event.receivedState == 'OFF' &&
      items.getItem('OPENHARMONIE_Activity_Starting')?.state != activities['PowerOff']
    ) {
      items.getItem('OPENHARMONIE_Activity_Starting')?.sendCommand(activities['PowerOff']);
    }
  },
});
