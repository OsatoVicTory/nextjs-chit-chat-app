"use client";

import { AppContext } from "@/context/app";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { addNewUser } from "./actions/db";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import styles from "./home.module.css";

export default function Home() {

  const { setUser, socket, setSocket } = useContext(AppContext);
  const [loading, setLoading] = useState<boolean>(false);
  const inputref = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    if(!socket) {
      const SocketInstance = io("https://socket-io-backend-yu0w.onrender.com");

      SocketInstance.on("connect", () => {
          setSocket(SocketInstance);
      });
    }
    document.title = "CHIT-CHAT APP";
  }, [socket]);

  const handleLogIn = useCallback(async () => {
    if(loading) return;
    if(socket && socket.id && inputref.current?.value) {
      setLoading(true);
      const userName = inputref.current.value;
      const user_id = localStorage.getItem("chit_chat_id") || uuidv4();
      const userData = { userName, socketId: socket.id, lastSeen: "online", user_id };
      setUser(userData);
      await addNewUser(userData);
      localStorage.setItem("chit_chat_id", user_id);
      socket.emit("userOnline", userData);
      setLoading(false);
      router.push("/chat");
    }
  }, [socket, loading]);

  return (
    <div className={styles.Home}>
      <div className={styles.App_Home_Page}>
          <div className={styles.App_Home_Wrapper}>
            <div className={styles.AHW}>
              <h1>Chit Chat App</h1>
              <h3>Log In</h3>
              <p>Enter your name to log in</p>
            </div>
            <input placeholder="Enter your name" ref={inputref} />
            {socket && <button className={`${styles.logIn_btn} ${styles[`loggingIn_${loading}`]} pointer`} onClick={handleLogIn}>
              {loading ? "Logging in..." : "Log in"}
            </button>}
            {!socket && <button className={`${styles.logIn_btn} ${styles[`loggingIn_true`]}`}>
              Waiting for socket connection...
            </button>}
          </div>
      </div>
    </div>
  );
}
