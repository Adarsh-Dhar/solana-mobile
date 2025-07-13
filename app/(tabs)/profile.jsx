import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { authService } from "../../utils/auth";

export default function Profile() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [isWalletUser, setIsWalletUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const isGuest = await AsyncStorage.getItem("isGuest");
        const walletAddress = await authService.getWalletAddress();
        const username = await authService.getUsername();
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated && walletAddress) {
          setUserInfo({
            walletAddress,
            username,
            type: 'wallet'
          });
          setIsWalletUser(true);
        } else if (isGuest === "true") {
          setUserInfo({
            type: 'guest'
          });
          setIsWalletUser(false);
        } else {
          setUserInfo(null);
          setIsWalletUser(false);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      if (isWalletUser) {
        await authService.logout();
      } else {
        // Handle guest logout
        await AsyncStorage.removeItem("userEmail");
        await AsyncStorage.setItem("isGuest", "true");
      }

      setUserInfo(null);
      setIsWalletUser(false);

      Alert.alert("Logged out", "You have been logged out successfully.");
      router.push("/signin");
    } catch (error) {
      Alert.alert("Logout Error", "Error while logging out");
    }
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#2b2b2b]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#2b2b2b]">
      <Text className="text-xl text-[#f49b33] font-semibold mb-4">
        User Profile
      </Text>
      
      {userInfo ? (
        <>
          {isWalletUser ? (
            <>
              <Text className="text-white text-lg mb-2">
                Username: {userInfo.username}
              </Text>
              <Text className="text-white text-sm mb-2">
                Wallet: {userInfo.walletAddress.slice(0, 8)}...{userInfo.walletAddress.slice(-4)}
              </Text>
              <Text className="text-[#f49b33] text-sm mb-6">
                Solana Wallet Connected
              </Text>
            </>
          ) : (
            <Text className="text-white text-lg mb-6">
              Guest User
            </Text>
          )}
          
          <TouchableOpacity
            onPress={handleLogout}
            className="p-2 my-2 bg-[#f49b33] text-black rounded-lg mt-10"
          >
            <Text className="text-lg font-semibold text-center">
              {isWalletUser ? "Disconnect Wallet" : "Logout"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-white text-lg mb-6">
            Not signed in
          </Text>
          <TouchableOpacity
            onPress={handleSignup}
            className="p-2 my-2 bg-[#f49b33] text-black rounded-lg mt-10"
          >
            <Text className="text-lg font-semibold text-center">Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
