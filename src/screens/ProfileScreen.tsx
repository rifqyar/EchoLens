import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { COLORS } from '../assets/theme';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

type User = {
  name: string;
  photo: string;
};

import type { StackNavigationProp } from '@react-navigation/stack';

type ProfileScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        console.log(jsonValue)
        if (jsonValue != null) {
          var userJson = JSON.parse(jsonValue)
          userJson.name = userJson.name.split(" ");
          userJson.name = userJson.name.reverse().join(" ")
          setUser(userJson);
        }
      } catch (e) {
        console.log('Error fetching user:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const renderMenuItem = (iconName: any, title: any, onPress: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialDesignIcons name={iconName} size={24} color="#cfcfcfff" />
      <Text style={styles.menuText}>{title}</Text>
      <MaterialDesignIcons name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user');
            navigation.replace('Login'); // arahkan ke screen login
          }
        }
      ]
    );
  };

  return (
    <ScreenLayout withBackgroundImg edges={['left', 'right']}>
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, COLORS.tertiary]} // lightGrey ke accentGrey
          style={styles.cardGradient}
        >
          <View style={styles.profileContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: user.photo ?? `https://ui-avatars.com/api/?name=${user.name}` }}
                style={styles.profileImage}
              />
              {/* <TouchableOpacity
                style={styles.editButton}
                onPress={() => console.log('Edit pressed')}
              >
                <LinearGradient
                  colors={['#ffffff', '#ddcbeaff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  <MaterialDesignIcons name='pencil' size={26} color={COLORS.secondary} />
                </LinearGradient>
              </TouchableOpacity> */}
            </View>

            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          {/* Menu Card 1: Account and Security */}
          {/* <LinearGradient
          colors={[COLORS.background, COLORS.tertiary]}
          style={styles.menuCard}
        >
          {renderMenuItem('account-circle', 'Account and Security', () => console.log('Account pressed'))}
        </LinearGradient> */}

          {/* Menu Card 2: Backend Permission Setting */}
          {/* <LinearGradient
          colors={[COLORS.background, COLORS.tertiary]}
          style={styles.menuCard}
        >
          {renderMenuItem('security', 'Backend Permission Setting', () => console.log('Backend pressed'))}
        </LinearGradient> */}
          {/* Menu Card 3: FAQ & About App */}
          <LinearGradient
            colors={[COLORS.background, COLORS.tertiary]}
            style={styles.menuCard}
          >
            {renderMenuItem('help-circle', 'FAQ', () => {
              navigation.push('FAQScreen')
            })}
            <Divider style={{ marginTop: 5 }} />
            {renderMenuItem('information', 'About App', () => {
              navigation.push('AboutScreen')
            })}
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 45,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  gradientButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 25,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    color: COLORS.white
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    borderRadius: 16,
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#f3f3f3ff',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ff4d4d',
    alignItems: 'center',
    flex: 0.01,
    position: 'relative'
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
