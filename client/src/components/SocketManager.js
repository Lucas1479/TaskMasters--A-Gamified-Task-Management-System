// src/components/SocketManager.js
import { useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import AuthContext from "../context/AuthContext";

export default function SocketManager() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.token) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token: user.token },
    });

    socket.on("connect", () => {
      console.log("✅ WebSocket connected");
    });

    socket.on("disconnect", () => {
    });

    socket.on("newAchievements", (achievements) => {
      console.log("🎉 Received new achievements:", achievements);
      achievements.forEach((ach) => {
        toast.success(`🎉 Achievement Unlocked: ${ach.name}`);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.token]);

  return null;
}
