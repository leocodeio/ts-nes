import { router, Slot } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView, Text, useColorScheme, View } from "react-native";

export default function NotificationLayout() {
  const theme = useColorScheme();

  return (
    <SafeAreaView className="pt-10">
      <View className="w-full h-full bg-black dark:bg-white flex flex-col">
        <View className="p-6 px-8 flex-row justify-between items-center">
          <ArrowLeft
            onPress={() => {
              router.back();
            }}
            size={24}
            color={theme === "dark" ? "black" : "white"}
          />
          <Text className="text-2xl font-light text-white text-center dark:text-black">
            Invite Parents/ Guardians
          </Text>
          <View className="flex-row gap-4" />
        </View>
        <Slot />
      </View>
    </SafeAreaView>
  );
}
