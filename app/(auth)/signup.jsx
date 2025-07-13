import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/dinetimelogo.png";
const entryImg = require("../../assets/images/Frame.png");
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectWallet } from "../../utils/solanaWallet";

const Signup = () => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGuest = async () => {
    await AsyncStorage.setItem("isGuest", "true");
    router.push("/home");
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      console.log("Starting wallet connection...");
      const result = await connectWallet();
      console.log("Wallet connection result:", result);
      
      if (result.success) {
        // Store wallet address as user identifier
        await AsyncStorage.setItem("userEmail", result.walletAddress);
        await AsyncStorage.setItem("isGuest", "false");
        
        Alert.alert(
          "Wallet Connected!",
          `Successfully connected to wallet: ${result.walletAddress.slice(0, 8)}...${result.walletAddress.slice(-4)}`,
          [{ text: "OK", onPress: () => router.push("/home") }]
        );
      } else {
        console.error("Wallet connection failed:", result.error);
        Alert.alert(
          "Connection Failed",
          result.error || "Failed to connect wallet. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      Alert.alert(
        "Connection Error",
        "An unexpected error occurred while connecting to wallet.",
        [{ text: "OK" }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView className={`bg-[#2b2b2b]`}>
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="m-2 flex justify-center items-center">
          <Image source={logo} style={{ width: 200, height: 100 }} />
          <Text className="text-lg text-center text-white font-bold mb-10">
            Connect your Solana wallet
          </Text>

          <View className="w-5/6">
            <TouchableOpacity
              onPress={handleConnectWallet}
              disabled={isConnecting}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${
                isConnecting ? "bg-gray-500" : "bg-[#f49b33]"
              }`}
            >
              {isConnecting ? (
                <ActivityIndicator color="#2b2b2b" size="small" />
              ) : (
                <Text className="text-lg font-semibold text-center text-black">
                  Connect Wallet
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex justify-center items-center">
              <TouchableOpacity
                className="flex flex-row justify-center mt-5 p-2 items-center"
                onPress={() => router.push("/signin")}
              >
                <Text className="text-white font-semibold">
                  Already have a wallet?{" "}
                </Text>
                <Text className="text-base font-semibold underline text-[#f49b33]">
                  Sign in
                </Text>
              </TouchableOpacity>

              <Text className="text-center text-base font-semibold mb-4 text-white">
                <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24" />{" "}
                or{" "}
                <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24" />
              </Text>
              <TouchableOpacity
                className="flex flex-row justify-center mb-5 p-2 items-center"
                onPress={handleGuest}
              >
                <Text className="text-white font-semibold">Continue as</Text>
                <Text className="text-base font-semibold underline text-[#f49b33]">
                  {" "}
                  Guest User
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View className="flex-1">
          <Image
            source={entryImg}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
        <StatusBar barStyle={"light-content"} backgroundColor={"#2b2b2b"} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;
