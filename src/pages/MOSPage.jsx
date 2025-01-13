import React from 'react';
import { Link } from 'react-router-dom';

const MOSPage = ({ data, row }) => {
  // 'row' is the MOS row (e.g., pageType="mos", id="SF", etc.).
  // We no longer do useParams() since our 'DynamicPage' (or equivalent) handles that.

  // Find any child rows where level==="2" and parent===row.id
  const courses = data.filter(r => r.level === '2' && r.parent === row.id);

  return (
    <div>
      <h1>{row?.title || 'MOS Page'}</h1>
      <p>{row?.message || ''}</p>

      {courses.length === 0 ? (
        <p>No courses found for this MOS.</p>
      ) : (
        <ul>
          {courses.map(course => (
            <li key={course.id}>
              {/* Link to "/<course.id>", letting the dynamic route handle it */}
              <Link to={`/${course.id}`}>{course.title}</Link>
            </li>
          ))}
        </ul>
      )}

      {/* Return link back to landing, presumably at "/" */}
      <Link to="/">Return to Main Page</Link>
    </div>
  );
};

export default MOSPage;
