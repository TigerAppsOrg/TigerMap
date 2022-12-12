import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Table from "./Table";
import axios from "axios";
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/esm/Row";
import graph from "../images/graph.png";
import { useNavigate } from "react-router-dom";

function TrackDetails() {
  const params = useParams();
  const [track, setTrack] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/trackdetails", { params: { id: params.id } })
      .then((response) => {
        setTrack(response.data);
      }).catch(() => {
        navigate("/notfound");
      });
  }, [params]);

  useEffect(() => {
    if (track) {
      axios
        .post("http://127.0.0.1:5000/graph", {
          course_ids: track.courses.map((course) => course._id),
        })
        .then((response) => {
          console.log(response.data);
        });
    }
  }, [track]);

  return (
    <Container fluid style={{ maxWidth: "1200px" }}>
      <Row className="justify-content-center">
        {track && (
          <Table
            header={track.title + " " + track.emoji}
            courses={track.courses}
            placeholder={`A course track is a group of courses that aligns with a student's interest area. 
            These are the courses in the ${track.title} track.`}
            showLinks
          />
        )}
      </Row>
      <Row>
        {track && <img src={graph} alt="graph" style={{ maxWidth: "100%" }} />}
      </Row>
    </Container>
  );
}

export default TrackDetails;
