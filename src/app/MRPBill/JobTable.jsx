import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";

const JobListTable = ({
    jobList,
    jobDetail,
    finalTotalAmount,
    handlePriceChange,
    handleSalePriceKeyDown,
    handleSalePriceFocus,
    handleImageError,
    handleJobDelete,
    editableFlag,
    selectedRows,
    selectAll,
    onSelectAll,
    onSelectRow,
}) => {
    return (
        <table className="table max_w_table">
            <thead className="table-head">
                <tr>
                    <td width={50} style={{ textAlign: 'center', borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>
                        <input type="checkbox" checked={selectAll} onChange={onSelectAll} />
                    </td>
                    <td width={90} style={{ borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>SrNo</td>
                    <td width={90} style={{ borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>Image</td>
                    <td width={520} style={{ borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>Description</td>
                    <td width={120} style={{ borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>Amount</td>
                    <td width={120} style={{ borderRight: "1px solid #989898", backgroundColor: "#e8e8e8" }}>Sale Price</td>
                    <td width={90} style={{ backgroundColor: "#e8e8e8" }}>Delete</td>
                </tr>
            </thead>
            <tbody className="table-body">
                {jobList?.length > 0 ? (
                    jobList?.map((e, i) => (
                        <tr key={i}>
                            <td width={50} align="center" style={{ borderRight: "1px solid #989898" }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRows.includes(e.StockBarcode)}
                                    onChange={() => onSelectRow(e.StockBarcode)}
                                />
                            </td>
                            <td width={90} align="center" className="pd_0" style={{ borderRight: "1px solid #989898" }}>
                                {i + 1}
                            </td>
                            <td width={90} align="center" className="pd_0" style={{ borderRight: "1px solid #989898" }}>
                                <img src={e?.DesignImage} alt="#img" className="tableImg" onError={handleImageError} />
                            </td>
                            <td width={520} className="pd_0" style={{ borderRight: "1px solid #989898" }}>
                                {e?.Description}
                            </td>
                            <td width={120} className="pd_0" style={{ borderRight: "1px solid #989898" }}>
                                <input
                                    type="number"
                                    value={e?.salePrice}
                                    autoFocus={e?.StockBarcode === jobDetail[0]?.StockBarcode}
                                    onChange={(event) => handlePriceChange(event, e)}
                                    onKeyDown={handleSalePriceKeyDown}
                                    onFocus={handleSalePriceFocus}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        textAlign: "center",
                                        backgroundColor: editableFlag ? "#E9ECEF" : "transparent",
                                        border: "1px solid #989898",
                                    }}
                                    disabled={editableFlag}
                                />
                            </td>
                            <td width={120} className="pd_0" style={{ borderRight: "1px solid #989898" }}>
                                <input
                                    type="number"
                                    value={(Number(e?.FinalPrice ?? e?.salePrice) || 0)?.toFixed(2)}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        textAlign: "center",
                                        backgroundColor: "#E9ECEF",
                                        border: "1px solid #989898",
                                    }}
                                    disabled={true}
                                />
                            </td>
                            <td width={90} align="center" className="pd_0">
                                <DeleteIcon
                                    titleAccess="delete"
                                    sx={{ color: "grey", cursor: "pointer" }}
                                    onClick={() => handleJobDelete(e)}
                                />
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} align="center">No Data Present</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default JobListTable;
