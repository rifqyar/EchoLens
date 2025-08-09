import Icon from '@react-native-vector-icons/material-icons'
import { useNavigation } from '@react-navigation/native'
import { Button, Layout, Text } from '@ui-kitten/components'
import { PropsWithChildren } from 'react'
import {
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native'

export const AppHeader = (
  props: PropsWithChildren & {
    goBackNavigation?: () => void
    withBack?: boolean
    title?: any
    style?: StyleProp<ViewStyle>
  }
) => {
  const navigation = useNavigation()

  return (
    <Layout
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingTop: (StatusBar.currentHeight ?? 0) + 12,
        paddingBottom: 12,
        ...(props.style ?? ({} as any)),
      }}
    >
      {props.withBack ? (
        <Button
          size="small"
          appearance="ghost"
          style={{ backgroundColor: 'transparent' }}
          accessoryLeft={
            <Icon name="arrow-back" size={18}></Icon>
          }
          onPress={() =>
            props.goBackNavigation
              ? props.goBackNavigation()
              : navigation.goBack()
          }
        ></Button>
      ) : (
        ''
      )}
      {props.title && (
        <Text
          style={{
            fontWeight: 'bold',
          }}
        >
          {props.title}
        </Text>
      )}
      {props.children}
    </Layout>
  )
}
