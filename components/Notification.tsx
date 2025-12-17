import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { NotificationState } from '../types';

interface Props {
    notification: NotificationState;
    onClose: () => void;
}

const Notification: React.FC<Props> = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification.show, onClose]);

    if (!notification.show) return null;

    const styles = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200'
    };

    const icons = {
        success: <CheckCircle className="text-green-500 mr-2" size={20} />,
        error: <AlertCircle className="text-red-500 mr-2" size={20} />,
        info: <Info className="text-blue-500 mr-2" size={20} />
    };

    return (
        <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 z-50 flex items-center min-w-[300px] animate-fade-in ${styles[notification.type]}`}>
            {icons[notification.type]}
            <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-xs opacity-90">{notification.message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                <X size={16} />
            </button>
        </div>
    );
};

export default Notification;