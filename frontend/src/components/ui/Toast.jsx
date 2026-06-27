import { toast } from 'react-toastify';
import { sanitizeNotificationMessage } from '../../utils/notificationText';

export const showToast = {
  success: (msg, options = {}) => {
    toast.success(sanitizeNotificationMessage(msg), {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options,
    });
  },
  error: (msg, options = {}) => {
    toast.error(sanitizeNotificationMessage(msg), {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options,
    });
  },
  info: (msg, options = {}) => {
    toast.info(sanitizeNotificationMessage(msg), {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options,
    });
  },
  warning: (msg, options = {}) => {
    toast.warn(sanitizeNotificationMessage(msg), {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options,
    });
  }
};

export default showToast;
