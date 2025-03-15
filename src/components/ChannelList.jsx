import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';
import ChannelCard from './ChannelCard';

export default function ChannelList() {
  const { channels, groups } = useIPTV();
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredChannels = channels.filter(channel => {
    const matchesGroup = selectedGroup === 'All' || channel.group === selectedGroup;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });
  
  return (
    <div className="channel-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="All">All Groups</option>
          {groups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>
      
      <div className="channels-grid">
        {filteredChannels.length === 0 ? (
          <p>No channels found</p>
        ) : (
          filteredChannels.map(channel => (
            <ChannelCard key={channel.id} channel={channel} />
          ))
        )}
      </div>
    </div>
  );
}
