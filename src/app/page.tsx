import AppFrame from "@/components/layout/AppFrame";
import SetupScreen from "@/components/layout/SetupScreen";

export default function SetupPage() {
  return (
    <AppFrame withTabs={false}>
      <SetupScreen />
    </AppFrame>
  );
}
