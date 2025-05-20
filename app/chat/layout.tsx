import ChatList from "@/components/chatList/chatList";
import styles from "./chat.module.css";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <div className="appLayout">
            <div className={styles.chat_content}>
                <ChatList />
                {children}
            </div>
        </div>
    );
}
