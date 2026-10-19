import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/shared/ui";
import { COLORS } from "@/shared/theme";

function Metric({ icon, value, label }) {
    return (
        <View className="flex-1 flex-row items-center bg-gray-50 rounded-2xl px-3 py-2.5">
            <Ionicons name={icon} size={18} color={COLORS.primary} />
            <Text className="text-lg font-extrabold text-ink ml-2">{value}</Text>
            <Text className="text-xs text-gray-500 ml-1.5">{label}</Text>
        </View>
    );
}

export default function CentroCard({ centro, onPress }) {
    return (
        <Card onPress={onPress}>
            <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-2xl bg-sena-soft items-center justify-center">
                    <Ionicons name="business" size={22} color={COLORS.primary} />
                </View>
                <View className="flex-1 ml-3.5">
                    <Text className="text-base font-bold text-gray-900 leading-5">{centro.nombre}</Text>
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="location-outline" size={14} color={COLORS.gray500} />
                        <Text className="text-sm text-gray-500 ml-1 flex-1" numberOfLines={1}>
                            {[centro.ubicacion, centro.direccion].filter(Boolean).join(" · ")}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="flex-row gap-2 mt-4">
                <Metric icon="git-branch-outline" value={centro.sedes} label="sedes" />
                <Metric icon="easel-outline" value={centro.ambientes} label="ambientes" />
            </View>
        </Card>
    );
}
