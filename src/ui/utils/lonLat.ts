export const getPolygonGeometry = (polygonCoordinates: number[][]) => {
  const topLeft = polygonCoordinates[0];
  const topRight = polygonCoordinates[1];
  const bottomRight = polygonCoordinates[2];
  const bottomLeft = polygonCoordinates[3];
  return `POLYGON((${topLeft[0]} ${topLeft[1]}, ${topRight[0]} ${topRight[1]}, ${bottomRight[0]} ${bottomRight[1]}, ${bottomLeft[0]} ${bottomLeft[1]}, ${topLeft[0]} ${topLeft[1]}))`;
};

export const downloadJson = (data, fileName: string) => {
  const prettyJson = JSON.stringify(data, null, 2);
  const blob = new Blob([prettyJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
