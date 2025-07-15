import { View, Text, FlatList, Alert, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';

const USERS_COLLECTION = "users";

const SearchScreen = () => {
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const db = getFirestore();

  // Load recent searches from AsyncStorage
  useEffect(() => {
    const loadRecentSearches = async () => {
      const stored = await AsyncStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored));
    };
    loadRecentSearches();
  }, []);

  // Fetch all users (girls) from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, USERS_COLLECTION);
      const usersSnapshot = await getDocs(usersCollection);
      const userList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      // If no users collection, mock data
      setUsers([
        { id: "1", username: "Alice", bio: "NFT lover", profilePicture: "https://randomuser.me/api/portraits/women/1.jpg" },
        { id: "2", username: "Bella", bio: "Solana DeFi queen", profilePicture: "https://randomuser.me/api/portraits/women/2.jpg" },
        { id: "3", username: "Cara", bio: "Crypto artist", profilePicture: "https://randomuser.me/api/portraits/women/3.jpg" },
      ]);
      setFilteredUsers([
        { id: "1", username: "Alice", bio: "NFT lover", profilePicture: "https://randomuser.me/api/portraits/women/1.jpg" },
        { id: "2", username: "Bella", bio: "Solana DeFi queen", profilePicture: "https://randomuser.me/api/portraits/women/2.jpg" },
        { id: "3", username: "Cara", bio: "Crypto artist", profilePicture: "https://randomuser.me/api/portraits/women/3.jpg" },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search input
  const handleSearch = (text) => {
    setSearch(text);
    if (!text) {
      setFilteredUsers(users);
      return;
    }
    setSearching(true);
    const filtered = users.filter((user) =>
      user.username.toLowerCase().includes(text.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredUsers(filtered);
    setSearching(false);
  };

  // Handle selecting a recent search
  const handleRecentSearch = (text) => {
    setSearch(text);
    handleSearch(text);
  };

  // Save search to recent
  const saveRecentSearch = async (text) => {
    if (!text.trim()) return;
    const updated = [text, ...recentSearches.filter((s) => s !== text)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // When user submits search
  const onSubmitEditing = () => {
    handleSearch(search);
    saveRecentSearch(search);
  };

  // Render user profile card
  const renderUser = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-[#fb9b33] bg-[#232323] rounded-xl mb-2"
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <Image
        source={{ uri: item.profilePicture }}
        className="w-14 h-14 rounded-full mr-4 border-2 border-[#fb9b33]"
      />
      <View className="flex-1">
        <Text className="text-white text-lg font-semibold">{item.username}</Text>
        <Text className="text-gray-300 text-sm">{item.bio}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#fb9b33" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#2b2b2b] px-4 pt-2">
      {/* Search Bar */}
      <View className="flex-row items-center bg-[#232323] rounded-xl px-3 py-2 mb-4 border border-[#fb9b33]">
        <Ionicons name="search" size={22} color="#fb9b33" className="mr-2" />
        <TextInput
          className="flex-1 text-white text-base"
          placeholder="Search for people..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSearch}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />
      </View>
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View className="mb-4">
          <Text className="text-[#fb9b33] mb-2 font-semibold">Recent Searches</Text>
          <View className="flex-row flex-wrap gap-2">
            {recentSearches.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                className="bg-[#fb9b33] px-3 py-1 rounded-full mb-2 mr-2"
                onPress={() => handleRecentSearch(s)}
              >
                <Text className="text-black font-medium">{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {/* User List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fb9b33" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">No results found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
