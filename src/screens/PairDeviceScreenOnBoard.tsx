import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { SectionLayout } from '../components/layout/SectionLayout'
import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer'
import { Button } from 'react-native-paper'
import { COLORS } from '../assets/theme'
import { NavigationProp, useNavigation } from '@react-navigation/native'

type RootStackParamList = {
  PairDeviceScreen: undefined;
  ScanDeviceScreen: undefined;
  // add other routes here if needed
};

const PairDeviceScreenOnBoard = ({navigation} : any) => {
  // const navigation = useNavigation<NavigationProp<RootStackParamList>>()

  return (
    <>
      <AppHeader withBack title='Prepare for Pairing' />
      <ScreenLayout withBackgroundImg style={{
        paddingTop: 0,
        paddingBottom: 0,
      }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Image source={require('../assets/img/logo-alt.png')} style={{ width: '50%', height: 100, resizeMode: 'contain' }} />
          </View>
          <SectionLayout edges={['left', 'right']} style={{ padding: 20, justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>
              Instructions for Pairing Device
            </Text>
            <Text style={{ marginTop: 10, color: '#d7d7d7ff' }}>
              Follow the instructions to pair your device.
            </Text>
            <Text style={{ marginTop: 10, color: '#d7d7d7ff' }}>
              1. Turn On the Glasses and configm that the blue indicator light is flashing.
            </Text>
            <Text style={{ marginTop: 10, color: '#d7d7d7ff' }}>
              2. Turn On your phone BlueTooth to Pair.
            </Text>
            <Text style={{ marginTop: 5, color: '#d7d7d7ff' }}>
              3. Click the "Pair Device" button below to start pairing.
            </Text>
          </SectionLayout>
        </View>
        <SectionLayout style={{ padding: 20 }}>
          <Button
            mode='contained'
            onPress={() => {
              if(Platform.OS == 'android'){
                navigation.push('PairDeviceScreen')
              } else if (Platform.OS == 'ios'){
                navigation.push('ScanDeviceScreen')
              }
            }}
            style={{ width: '100%', marginBottom: 35 }}
            labelStyle={{ fontSize: 16, color: '#FFF' }}
            buttonColor={COLORS.primary}
          >
            Pair Device
          </Button>
        </SectionLayout>
      </ScreenLayout>
    </>
  )
}

export default PairDeviceScreenOnBoard

const styles = StyleSheet.create({})