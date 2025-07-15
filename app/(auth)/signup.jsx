import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/dinetimelogo.png";
const entryImg = require("../../assets/images/Frame.png");
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../../utils/auth";
import DateTimePicker from '@react-native-community/datetimepicker';

const Signup = () => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleGuest = async () => {
    await AsyncStorage.setItem("isGuest", "true");
    router.push("/(tabs)/matches");
  };

  const handleConnectWallet = async () => {
    if (!username.trim() || !gender || !dateOfBirth) {
      Alert.alert("Missing Info", "Please complete all steps to continue.");
      return;
    }
    setIsConnecting(true);
    try {
      const result = await authService.registerWithWallet(
        username.trim(),
        gender,
        dateOfBirth.toISOString()
      );
      await AsyncStorage.setItem("isGuest", "false");
      router.push("/(tabs)/matches");
    } catch (error) {
      console.error("Registration error (full):", error);
      // Try to show backend validation error if present
      let errorMsg = error.message || "Failed to register with wallet. Please try again.";
      if (error.response && error.response.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMsg = error.response.data.errors[0].msg;
        } else if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      }
      Alert.alert(
        "Registration Failed",
        errorMsg,
        [{ text: "OK" }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View className="w-5/6">
            <Text className="text-white text-lg mb-2">What's your name?</Text>
            <TextInput
              placeholder="Enter username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              className="p-4 mb-4 bg-white rounded-lg text-black"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setStep(2)}
              disabled={!username.trim()}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${!username.trim() ? "bg-gray-500" : "bg-[#f49b33]"}`}
            >
              <Text className="text-lg font-semibold text-center text-black">Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View className="w-5/6">
            <Text className="text-white text-lg mb-2">Select your gender</Text>
            <View className="flex-row justify-between mb-4">
              {['male', 'female', 'non-binary', 'prefer not to say'].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  className={`px-4 py-2 rounded-lg ${gender === g ? 'bg-[#f49b33]' : 'bg-white'} mx-1`}
                >
                  <Text className={`text-base ${gender === g ? 'text-black font-bold' : 'text-gray-700'}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setStep(3)}
              disabled={!gender}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${!gender ? "bg-gray-500" : "bg-[#f49b33]"}`}
            >
              <Text className="text-lg font-semibold text-center text-black">Next</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} className="mt-2">
              <Text className="text-white underline text-center">Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View className="w-5/6">
            <Text className="text-white text-lg mb-2">What's your date of birth?</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                className="p-4 mb-4 bg-white rounded-lg text-black w-full"
                style={{ fontSize: 16 }}
                value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val) setDateOfBirth(new Date(val));
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="p-4 mb-4 bg-white rounded-lg"
              >
                <Text className="text-black text-center">{dateOfBirth ? dateOfBirth.toDateString() : 'Select date of birth'}</Text>
              </TouchableOpacity>
            )}
            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDateOfBirth(selectedDate);
                }}
              />
            )}
            <TouchableOpacity
              onPress={() => setStep(4)}
              disabled={!dateOfBirth}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${!dateOfBirth ? "bg-gray-500" : "bg-[#f49b33]"}`}
            >
              <Text className="text-lg font-semibold text-center text-black">Next</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(2)} className="mt-2">
              <Text className="text-white underline text-center">Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View className="w-5/6">
            <Text className="text-white text-lg mb-4">Ready to create your account?</Text>
            <TouchableOpacity
              onPress={handleConnectWallet}
              disabled={isConnecting}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${isConnecting ? "bg-gray-500" : "bg-[#f49b33]"}`}
            >
              {isConnecting ? (
                <ActivityIndicator color="#2b2b2b" size="small" />
              ) : (
                <Text className="text-lg font-semibold text-center text-black">Connect Wallet & Register</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(3)} className="mt-2">
              <Text className="text-white underline text-center">Back</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className={`bg-[#2b2b2b]`}>
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="m-2 flex justify-center items-center">
          <Image source={logo} style={{ width: 200, height: 100 }} />
          <Text className="text-lg text-center text-white font-bold mb-10">
            Create your account with Solana wallet
          </Text>
          {/* Stepper */}
          <View className="flex-row justify-center mb-6">
            {[1,2,3,4].map((s) => (
              <View key={s} className={`w-4 h-4 mx-1 rounded-full ${step === s ? 'bg-[#f49b33]' : 'bg-gray-600'}`}/>
            ))}
          </View>
          {renderStep()}
          <TouchableOpacity
            onPress={handleGuest}
            className="p-4 my-4 bg-transparent border border-white rounded-lg"
          >
            <Text className="text-lg font-semibold text-center text-white">Continue as Guest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/signin")}
            className="p-4 my-4 bg-transparent"
          >
            <Text className="text-lg font-semibold text-center text-[#f49b33]">Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;
