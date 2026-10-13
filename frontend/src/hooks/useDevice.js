import { useMQTT } from './useMQTT';
export const useDevice = () => useMQTT('ift/telemetry', {});