function CurrentCourse(props) {
  console.log(props.details);
  if (props.details == null) {
    return (
      <div
        style={{
          borderRadius: "25px",
          paddingLeft: "10px",
          paddingRight: "10px",
          paddingTop: "50px",
          paddingBottom: "50px",
        }}
        className="m-4 myTable"
      >
        <p
          style={{ textAlign: "center", fontSize: "24px", marginBottom: "0px" }}
        >
          Enter a course name or keyword into the search bar to see
          prerequisites and postrequisites.{" "}
        </p>
      </div>
    );
  } else {
    return (
      <div
        style={{ borderRadius: "25px", padding: "10px" }}
        className="m-4 myTable"
      >
        <h2 style={{ textAlign: "center", paddingBottom: "10px" }}>
          {props.details.crosslistings}: {props.details.long_title}
        </h2>
        <p>
          <b>Description: </b>
          {props.details.description}
        </p>
        <p>
          <b>Reading/Writing Assignments: </b>
          {props.details.reading_writing_assignment || "N/A"}
        </p>
        <p>
          <b>Prerequisites and Restrictions: </b>
          {props.details.other_restrictions || "N/A"}
        </p>
        <p>
          <b>Distribution Areas:</b>{" "}
          {props.details.distribution_area_short || "N/A"}
        </p>
      </div>
    );
  }
}

export default CurrentCourse;
