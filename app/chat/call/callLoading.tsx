import Skeleton from "@/components/chatList/skeleton";
import styles from "./call.module.css";

export default function CallLoading() {

    return (
        <div className={styles.Call}>
            <div className={styles.Call__Container}>
                <div className={`${styles.Call__main} audio ${styles.Call__main__loading}`}>
                    <div className={styles.callProfileImage_loading}><Skeleton /></div>
                    <h3 className="text-white">Loading...</h3>
                </div>
            </div>
        </div>
    )
};