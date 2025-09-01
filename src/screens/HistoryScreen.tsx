import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import RecordingsList from '../components/common/RecordingList'

const HistoryScreen = () => {
  return (
    <>
      <AppHeader withBack title='History' />
      <ScreenLayout withBackgroundImg edges={['left', 'right']}>
        <RecordingsList />
      </ScreenLayout>
    </>
  )
}

export default HistoryScreen

const styles = StyleSheet.create({})