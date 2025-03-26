import { useIptv } from '../context/IptvContext.jsx';
import { useNavigate } from 'react-router-dom';
import "../styles/ChannelList.css"

export default function ChannelCard({ channel }) {
  const { setCurrentChannel } = useIptv();
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
