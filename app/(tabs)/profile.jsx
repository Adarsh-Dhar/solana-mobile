import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { disconnectWallet, isWalletConnected } from "../../utils/solanaWallet";

export default function Profile() {
  const router = useRouter();
  const [userWallet, setUserWallet] = useState(null);
  const [isWalletUser, setIsWalletUser] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      const isGuest = await AsyncStorage.getItem("isGuest");
      const walletConnected = await isWalletConnected();
      
      setUserWallet(email);
      setIsWalletUser(walletConnected && isGuest !== "true");
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      if (isWalletUser) {
        await disconnectWallet();
      } else {
        // Handle guest logout
        await AsyncStorage.removeItem("userEmail");
        await AsyncStorage.setItem("isGuest", "true");
      }

      setUserWallet(null);
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

  return (
    <View className="flex-1 justify-center items-center bg-[#2b2b2b]">
      <Text className="text-xl text-[#f49b33] font-semibold mb-4">
        User Profile
      </Text>
      {userWallet ? (
        <>
          <Text className="text-white text-lg mb-2">
            {isWalletUser ? "Wallet Address:" : "Email:"} {userWallet}
          </Text>
          {isWalletUser && (
            <Text className="text-[#f49b33] text-sm mb-6">
              Solana Wallet Connected
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
