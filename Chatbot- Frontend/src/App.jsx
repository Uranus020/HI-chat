import ChatBot from "./components/ChatBot";

export default function App() {
  return (
    <div className="min-h-screen bg-[#fff9f1] p-4 md:p-8">
      <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
        <ChatBot />
      </div>
    </div>
  );
}
