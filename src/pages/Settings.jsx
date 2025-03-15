import M3ULoader from '../components/M3ULoader';
import XtremeCodeLoader from '../components/XtremeCodeLoader';
import { useIPTV } from '../contexts/IPTVContext';

export default function Settings() {
  const { setChannels } = useIPTV();
  
  const clearChannels = () => {
    if (window.confirm('Are you sure you want to clear all channels?')) {
      setChannels([]);
    }
  };
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <section className="loaders">
        <M3ULoader />
        <XtremeCodeLoader />
      </section>
      
      <section className="danger-zone">
        <h3>Danger Zone</h3>
        <button className="danger" onClick={clearChannels}>
          Clear All Channels
        </button>
      </section>
    </div>
  );
}
