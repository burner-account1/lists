import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = ({ data }) => {
  // 1) Find the row for your "landing" info (previously level === "0")
  const pageInfo = data.find(row => row.level === '0');

  // 2) Find rows that represent the MOS options (previously level === "1")
  const mosList = data.filter(row => row.level && row.level.trim() === '1');

  return (
    <div>
      <h1>{pageInfo?.title || ''}</h1>
      <p>{pageInfo?.message || ''}</p>

      <ul>
        {mosList.map(mos => (
          <li key={mos.id}>
            {/* Instead of "/mos/<id>", link to "/<id>" */}
            <Link to={`/${mos.id}`}>{mos.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LandingPage;
