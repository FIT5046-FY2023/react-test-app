import {
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Paper,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  LinearProgress,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useState } from "react";
import React from "react";
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridColDef,
  GridNoRowsOverlay,
  GridRowsProp,
} from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";

interface SelectedDatasetInfo {
  datasetName: string;
  headers: string[];
}
interface ExistingDatasetTableProps {
  selectedData: React.SetStateAction<string>;
  setSelectedData: React.Dispatch<React.SetStateAction<string>>;
}

const ExistingDatasetTable = ({
  selectedData,
  setSelectedData,
}: ExistingDatasetTableProps) => {
  const [loadingDataset, setLoadingDataset] = useState<boolean>(false);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [selectedDataset, setSelectedDataset] = useState();
  const [datasetsResult, setDatasetsResult] = useState<string[]>([]);
  const [processingDelete, setProcessingDelete] = useState<boolean>(false);

  // Set up cache system for already downloaded datasets so don't have to redownload
  //   const tableHeaders = ["Name", "Size", "Action"];
  const tableHeaders = ["Name", "Action", ""];

  const handlePreview = (index: number) => {
    setLoadingDataset(true);
    handleFetchDataset(index);
  };

  const removeDataset = (indexToRemove: number) => {
    const updatedDatasetResult = datasetsResult.filter((_dataset, idx) => idx !== indexToRemove);
    setDatasetsResult(updatedDatasetResult);
  }

  const handleDeleteDataset = async (e: any, index:number) => {
    console.log("handleDeleteDataset", e, index);
    setProcessingDelete(true);
    console.log("Request body:\n",  JSON.stringify({
      datasetNames: [datasetsResult[index]],
    }));

    fetch("http://127.0.0.1:5000/db_datasets", {
      method: "DELETE",
      body: JSON.stringify({
        datasetNames: [datasetsResult[index]],
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        setProcessingDelete(false);
        console.log(response);
        return response.json();
      })
      .then((data) => {
        console.log("data", data);
        console.log("data", data.document);
        removeDataset(index);
      })
      .catch((err) => {
        console.log(err.message);
        setLoadingDataset(false);
        setError(err.message);
      });

  };

  const handleFetchDataset = async (index: number) => {
    fetch("http://127.0.0.1:5000/db_datasets", {
      method: "POST",
      body: JSON.stringify({
        datasetName: datasetsResult[index],
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        if (response.status !== 200) setLoadingDataset(false);
        console.log(response);
        return response.json();
      })
      .then((data) => {
        console.log("data", data.document);
        setSelectedDataset(data.document);
      })
      .catch((err) => {
        console.log(err.message);
        setLoadingDataset(false);
        setError(err.message);
      });
  };

  useEffect(() => {
    setLoadingDataset(false);
  }, [selectedDataset, error]);

  useEffect(() => {
    setLoadingDatasets(false);
    console.log("datasets", datasetsResult);
  }, [datasetsResult, error]);

  useEffect(() => {
    setLoadingDatasets(true);
    fetchDatasets({
      setDatasetResult: setDatasetsResult,
      setError,
    });
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedData(event.target.value);
    //console.log("selected value: " + selectedValue)
  };

  const headerKeys = () =>
    selectedDataset ? Object.keys(selectedDataset) : [];
  console.log(headerKeys);

  const newTableHeaderKeys = () => {
    const [name, action, _] = tableHeaders;
    const columns: GridColDef[] = [
      {
        ...GRID_CHECKBOX_SELECTION_COL_DEF,
        width: 100,
      },
      { field: "name", headerName: name, width: 350 },

      {
        field: "action",
        headerName: action,
        width: 150,
        renderCell: (params) => {
          const idx =
            typeof params.id === "string"
              ? parseInt(params.id)
              : (params.id as number);
          return <PreviewBtn index={idx} />;
        },
      },

      {
        field: "delete",
        headerName: "Delete",
        width: 150,
        renderCell: (params) => {
          const idx =
            typeof params.id === "string"
              ? parseInt(params.id)
              : (params.id as number);
            const name = params.row.name;
            console.log("render call name:", name);
          return <DeleteBtn index={idx} />;
        },
      },
    ];
    return columns;
  };

  const PreviewBtn = ({ index }: { index: number }) => {
    return (
      <Button
        variant="outlined"
        onClick={(e) => handlePreview(index)}
        startIcon={<VisibilityIcon />}
      >
        Preview
      </Button>
    );
  };
  const DeleteBtn = ({ index }: { index: number }) => {
    return (
      <IconButton size="small" onClick={(e) => handleDeleteDataset(e, index)}>
        <DeleteIcon />
      </IconButton>
    );
  };

  const rows: GridRowsProp<{id: number, name: string}> = datasetsResult?.map(
    (datasetName: string, index: number) => {
      console.log(datasetName);
      return {
        id: index,
        name: datasetName
      };
    }
  );

  return (
    <>
      <Card elevation={0} sx={{ borderRadius: 2, my: 4 }} variant="outlined">
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {tableHeaders.map((key) => (
                  <TableCell key={key} align="center" style={{ minWidth: 170 }}>
                    {key}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingDatasets && (
                <TableRow key={"Los"}>
                  <TableCell>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}
              {!loadingDatasets &&
                datasetsResult?.map((datasetName: string, index: number) => {
                  console.log(datasetName);
                  return (
                    <TableRow key={datasetName}>
                      <TableCell key={"name"} align="center">
                        {datasetName}
                      </TableCell>
                      {/* <TableCell key={"size"} align="center">
                      {file.size}
                    </TableCell> */}

                      <TableCell key={"preview"} align="center">
                        <Button
                          variant="outlined"
                          onClick={(e) => handlePreview(index)}
                          startIcon={<VisibilityIcon />}
                        >
                          Preview
                        </Button>
                      </TableCell>

                      <TableCell key={"radio"} align="center">
                        <RadioGroup
                          aria-label="dataset-selection"
                          value={selectedData}
                          onChange={handleChange}
                        >
                          <FormControlLabel
                            value={datasetName}
                            control={<Radio />}
                            label=""
                          />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <>
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            checkboxSelection
            columns={newTableHeaderKeys()}
            slots={{
              loadingOverlay: LinearProgress,
              noRowsOverlay: GridNoRowsOverlay,
            }}
            loading={loadingDatasets}
            disableRowSelectionOnClick
            onRowSelectionModelChange={(rowSelectionModel) =>
              console.log(rowSelectionModel)
            }
          />
        </div>
      </>

      <br />
      {loadingDataset && <CircularProgress />}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {!!selectedDataset &&
                  headerKeys().map((header) => (
                    <TableCell
                      key={header}
                      align="center"
                      style={{ minWidth: 170 }}
                    >
                      {header}
                    </TableCell>
                  ))}
                {!selectedDataset && (
                  <TableCell key={"key"} align="center">
                    <Typography> No data to preview </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {!!selectedDataset && (
                <TableRow key={".id"}>
                  {Object.entries(selectedDataset).map(([key, val]) => {
                    console.log(key, val);
                    return (
                      <TableCell key={key} align="center">
                        {`${val}`}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

interface FetchDatasetsProps {
  setDatasetResult: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<any>>;
}
const fetchDatasets = async ({
  setDatasetResult,
  setError,
}: FetchDatasetsProps) => {
  fetch("http://127.0.0.1:5000/db_datasets")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);

      setDatasetResult(data.datasets);
    })
    .catch((error) => {
      setError(error);
      console.error(error);
    });
};

export default ExistingDatasetTable;
export { fetchDatasets };
