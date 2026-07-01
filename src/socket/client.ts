import { useSocketStore } from "@/stores/socketStore";
import { registerHandlers } from "./handlers";

// 初始化 socket 连接并注册所有服务端事件处理器。
// 幂等：重复调用只会初始化一次。
let initialized = false;

export function initSocket() {
  const socket = useSocketStore.getState().connect();
  if (!initialized) {
    registerHandlers(socket);
    initialized = true;
  }
  return socket;
}
