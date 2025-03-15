import { useIPTV } from '../contexts/IPTVContext';
import { useNavigate } from 'react-router-dom';

export default function ChannelCard({ channel }) {
  const { setCurrentChannel } = useIPTV();
  const navigate = useNavigate();
  
  const handleChannelClick = () => {
    setCurrentChannel(channel);
    navigate('/watch');
  };
  
  return (
    <div className="channel-card" onClick={handleChannelClick}>
      <div className="channel-logo">
        {channel.logo ? (
          <img src={channel.logo} alt={channel.name} />
        ) : (
          <div className="channel-logo-placeholder">
            {channel.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="channel-info">
        <p className="channel-name">{channel.name}</p>
        <p className="channel-group">{channel.group}</p>
      </div>
    </div>
  );
}
