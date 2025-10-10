import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { AppHeader } from '../components/layout/AppHeader';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { COLORS } from '../assets/theme';

const FAQScreen = () => {
  const [expanded, setExpanded] = React.useState(null);

  const handlePress = (id: any) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <>
      <AppHeader withBack title='FAQ' />
      <ScreenLayout withBackgroundImg>
        <List.Section title="FAQ - Tact-ID" titleStyle={{ color: COLORS.white }}>
          <List.Accordion
            title="What is the Tact-ID?"
            titleStyle={{
              color: COLORS.white
            }}
            left={(props) => <List.Icon {...props} icon="information-outline" color={COLORS.lightGrey} />}
            expanded={expanded === 1}
            onPress={() => handlePress(1)}
            titleNumberOfLines={3}
          >
            <List.Item title="This app connects with SmartGlasses to display notifications, data, and assist with hands-free operations."
              titleStyle={{ color: COLORS.white }}
              titleNumberOfLines={3}
            />
          </List.Accordion>
          <Divider />

          <List.Accordion
            title="How do I connect the app with SmartGlasses?"
            titleStyle={{
              color: COLORS.white
            }}
            left={(props) => <List.Icon {...props} icon="bluetooth" color={COLORS.lightGrey} />}
            expanded={expanded === 2}
            onPress={() => handlePress(2)}
            titleNumberOfLines={3}
          >
            <List.Item title="Make sure Bluetooth is turned on, then open the app and go to the 'Pairing' menu. Select your SmartGlasses device from the list."
              titleStyle={{ color: COLORS.white }}
              titleNumberOfLines={3}
            />
          </List.Accordion>
          <Divider />

          <List.Accordion
            title="Can I use the app without SmartGlasses?"
            titleStyle={{
              color: COLORS.white
            }}
            left={(props) => <List.Icon {...props} icon="cellphone" color={COLORS.lightGrey} />}
            expanded={expanded === 3}
            onPress={() => handlePress(3)}
            titleNumberOfLines={3}
          >
            <List.Item title="Yes, some basic features are available on the smartphone, but the main features require a connection with SmartGlasses."
              titleStyle={{ color: COLORS.white }}
              titleNumberOfLines={3}
            />
          </List.Accordion>
          <Divider />

          <List.Accordion
            title="What should I do if the connection keeps dropping?"
            titleStyle={{
              color: COLORS.white
            }}
            left={(props) => <List.Icon {...props} icon="wifi-off" color={COLORS.lightGrey} />}
            expanded={expanded === 4}
            onPress={() => handlePress(4)}
            titleNumberOfLines={3}
          >
            <List.Item title="Keep the distance between your SmartGlasses and smartphone under 5 meters. If the issue persists, try restarting both devices."
              titleStyle={{ color: COLORS.white }}
              titleNumberOfLines={3}
            />
          </List.Accordion>
          <Divider />

          {/* <List.Accordion
            title="Who can I contact for support?"
            titleStyle={{
              color: COLORS.white
            }}
            left={(props) => <List.Icon {...props} icon="headset" color={COLORS.lightGrey} />}
            expanded={expanded === 5}
            onPress={() => handlePress(5)}
          >
            <List.Item title="You can reach our support team via the 'Help' menu in the app or by emailing support@smartglasses.app." 
              titleStyle={{color: COLORS.white}}
              titleNumberOfLines={3}
            />
          </List.Accordion> */}
          <Divider />

        </List.Section>
      </ScreenLayout>
    </>
  );
};

export default FAQScreen;
