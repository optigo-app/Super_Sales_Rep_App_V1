

import { CapitalizeWords, discountCriteria, otherAmountDetail, taxGenrator } from "../../../../Utils/globalFunc";
import { numberToWords } from "number-to-words";
import { cloneDeep } from 'lodash';
import { ToWords } from "to-words";
import { deepClone } from "@mui/x-data-grid/utils/utils";
export const OrganizeDataPrint = (header2, json1_1, json2_1, json3_1, invoiceNo, printName, evn) => {
  const toWords = new ToWords();
  let header = cloneDeep(header2);
  let json1 = cloneDeep(json1_1);
  let json2 = cloneDeep(json2_1);
  let json3 = cloneDeep(json3_1);

  let resultArray = [];
  let jobnodup = [];
  let maintotal = {
    diamonds: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      SettingAmount: 0
    },
    colorstone: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      SettingAmount: 0
    },
    metal: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      FineWt: 0,
      IsPrimaryMetal: 0,
      withOutPrimaryMetal:0,
      IsPrimaryMetal_Amount: 0,
      withoutPrimaryMetal_Amount:0,
      SettingAmount: 0
    },
    finding: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      SettingAmount: 0,
      SettingRate:0
    },
    misc: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      SettingAmount: 0,
      allpcs:0,
      allwt:0,
      allservwt:0,
      onlyHSCODE3_pcs:0,
      onlyHSCODE3_amt:0,
      withouthscode1_2_pcs:0,
      isHSCODE123_amt:0,
      onlyIsHSCODE0_Wt:0,
      onlyIsHSCODE0_Pcs:0,
      onlyIsHSCODE0_Amount:0,
      onlyIsHSCODE3_ServeWt:0
    },
    stone_misc: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
      SettingAmount: 0
    },
    diamond_colorstone_misc: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
    },
    diamond_colorstone_misc_2_new: {
      Wt: 0,
      Pcs: 0,
      Rate: 0,
      Amount: 0,
    },
    total_labour: {
      labour_rate: 0,
      labour_amount: 0,
    },
    total_primarymetal_netwt:0,
    total_other_charges: 0,
    total_diamond_colorstone_misc_amount: 0,
    total_other: 0,
    grosswt: 0,
    netwt: 0,
    netwtWithLossWt: 0,
    convertednetwt: 0,
    MetalAmount: 0,
    lossWt: 0,
    total_Wastage: 0,
    total_FineWt: 0,
    total_amount: 0,
    total_unitcost: 0,
    total_discount_amount: 0,
    total_purenetwt: 0,
    total_Quantity: 0,
    total_Making_Amount: 0,
    total_discount: 0,
    total_diamondHandling: 0,
    total_csamount: 0,
    total_Making_Amount_Other_Charges: 0,
    total_fineWtByMetalWtCalculation: 0,
    totalMiscAmount: 0,
    total_otherChargesMiscHallStamp: 0,
    total_TotalCsSetcost: 0,
    total_TotalDiaSetcost: 0,
    total_MakingAmount_Setting_Amount: 0,
    total_otherCharge_Diamond_Handling: 0,
  };

  //json1 array
  json1?.length > 0 &&
    json1?.forEach((j1) => {
      let all_m_d_c_m = [];
      let diamond_colorstone_misc = [];
      let diamond_colorstone_misc_2_new = [];
      let diamondList = [];
      let colorstoneList = [];
      let metalList = [];
      let findingList = [];
      let miscList = [];
      let miscList_duplicate = [];
      let miscList_IsHSCODE123 = [];
      let stone_miscList = [];
      // let blankArrDiamond = [];
      // let blankArrColorstone = [];
      // let blankArrMisc = [];
      // let blankArrMetal = [];
      // let blankArrFinding = [];
      // let blankArrstone_misc = [];
      // let diamondSettingGroup = [];
      // let colorstoneSettingGroup = [];
      // let diamondMetalPurityWise = [];
      // let colorstoneMetalPurityWise = [];
      let diamondWtMetalPurityWise = 0;
      let colorstoneWtMetalPurityWise = 0;
      let israteonpcsMISC0 = [];
      let israteonpcsMISC1 = [];
      let jobwise_totals = {
        diamonds: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          SettingAmount: 0,
          FineWt: 0,
          length: 0,
        },
        colorstone: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          SettingAmount: 0,
          FineWt: 0,
          length: 0,
        },
        metal: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          FineWt: 0,
          length: 0,
          IsPrimaryMetal:0,
          WithOutPrimaryMetal:0,
          IsPrimaryMetal_Amount:0,
          withoutPrimaryMetal_Amount:0,
          SettingAmount: 0,
          isPrimaryMetal : ''
        },
        finding: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          FineWt: 0,
          length: 0,
          SettingAmount: 0,
          SettingRate:0
        },
        misc: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          FineWt: 0,
          length: 0,
          withouthscode1_2_wt:0,
          withouthscode1_2_pcs:0,
          withouthscode1_2_amount:0,
          onlyHSCODE3_pcs : 0,
          onlyHSCODE3_amt : 0,
          SettingAmount: 0,
          allwt:0,
          allpcs:0,
          allservwt:0,
          isHSCODE123_amt:0,
          onlyIsHSCODE0_Wt:0,
          onlyIsHSCODE0_Pcs:0,
          onlyIsHSCODE0_Amount:0,
          onlyIsHSCODE3_ServeWt:0
        },
        stone_misc: {
          Wt: 0,
          Pcs: 0,
          Rate: 0,
          Amount: 0,
          FineWt: 0,
        },
        Making_Amount_Other_Charges: 0,
        fineWtByMetalWtCalculation: 0,
        otherChargesMiscHallStamp: 0,
        makingAmount_settingAmount: 0,
        jobwise_dia_wt_certificate:0,
       total_diamond_colorstone_misc_amount:0,
       primaryMetalPcs:0,
       primaryMetalWt:0,

      };

      let other_details = otherAmountDetail(j1?.OtherAmtDetail);
      maintotal.total_labour.labour_rate += j1?.MaKingCharge_Unit;
      maintotal.total_labour.labour_amount += j1?.MakingAmount;
      maintotal.total_other += j1?.OtherCharges;
      jobwise_totals.Making_Amount_Other_Charges += j1?.MakingAmount + j1?.OtherCharges;
      maintotal.total_Making_Amount_Other_Charges += j1?.MakingAmount + j1?.OtherCharges;
      maintotal.netwt += j1?.NetWt;
      maintotal.netwtWithLossWt = maintotal.netwtWithLossWt + (+j1?.NetWt + +j1?.LossWt);
      maintotal.lossWt += j1?.LossWt;
      maintotal.grosswt += j1?.grosswt;
      maintotal.total_amount += j1?.TotalAmount;
      maintotal.total_unitcost += j1?.UnitCost;
      maintotal.total_discount_amount += j1?.DiscountAmt;
      maintotal.total_purenetwt += j1?.PureNetWt;
      maintotal.total_Quantity += j1?.Quantity;
      maintotal.total_Making_Amount += j1?.MakingAmount;
      maintotal.MetalAmount += j1?.MetalAmount;
      maintotal.total_discount += j1?.Discount;
      maintotal.total_diamondHandling += j1?.TotalDiamondHandling;
      maintotal.total_Wastage += j1?.Wastage;
      maintotal.convertednetwt += j1?.convertednetwt;
      maintotal.total_other_charges += j1?.OtherCharges;
      maintotal.total_csamount += j1?.CsAmount;
      maintotal.totalMiscAmount += j1?.MiscAmount;
      maintotal.total_TotalCsSetcost += j1?.TotalCsSetcost;
      maintotal.total_TotalDiaSetcost += j1?.TotalDiaSetcost;
      maintotal.total_otherCharge_Diamond_Handling += j1?.TotalDiamondHandling + j1?.OtherCharges + j1?.MiscAmount;
      
      

      //json2
      json2?.length > 0 &&
        json2?.forEach((j2) => {

          if (j1?.SrJobno === j2?.StockBarcode) {
            //for diamond
            if (j2?.MasterManagement_DiamondStoneTypeid === 1) {
              all_m_d_c_m.push(j2)
              diamond_colorstone_misc?.push(j2);
              diamond_colorstone_misc_2_new?.push(j2);
              diamondList.push(j2);
              jobwise_totals.diamonds.Wt += j2?.Wt;
              jobwise_totals.diamonds.Pcs += j2?.Pcs;
              jobwise_totals.diamonds.Rate += j2?.Rate;
              jobwise_totals.diamonds.Amount += j2?.Amount;
              jobwise_totals.diamonds.FineWt += j2?.FineWt;
              jobwise_totals.diamonds.SettingAmount += j2?.SettingAmount;
              jobwise_totals.diamonds.length += 1;
              maintotal.diamonds.Wt += j2?.Wt;
              maintotal.diamonds.total_FineWt += j2?.FineWt;
              maintotal.diamonds.Pcs += j2?.Pcs;
              maintotal.diamonds.Rate += j2?.Rate;
              maintotal.diamonds.Amount += j2?.Amount;
              maintotal.diamonds.SettingAmount += +j2?.SettingAmount;
            }
            //for colorstone
            if (j2?.MasterManagement_DiamondStoneTypeid === 2) {
              all_m_d_c_m.push(j2)
              colorstoneList.push(j2);
              diamond_colorstone_misc?.push(j2);
              diamond_colorstone_misc_2_new?.push(j2);
              jobwise_totals.colorstone.Wt += j2?.Wt;
              jobwise_totals.colorstone.Pcs += j2?.Pcs;
              jobwise_totals.colorstone.Rate += j2?.Rate;
              jobwise_totals.colorstone.Amount += j2?.Amount;
              jobwise_totals.colorstone.FineWt += j2?.FineWt;
              jobwise_totals.colorstone.SettingAmount += j2?.SettingAmount;
              jobwise_totals.colorstone.length += 1;
              maintotal.colorstone.Wt += j2?.Wt;
              maintotal.colorstone.total_FineWt += j2?.FineWt;
              maintotal.colorstone.Pcs += j2?.Pcs;
              maintotal.colorstone.Rate += j2?.Rate;
              maintotal.colorstone.Amount += j2?.Amount;
              maintotal.colorstone.SettingAmount += +j2?.SettingAmount;
            }
            //for metal
            if (j2?.MasterManagement_DiamondStoneTypeid === 4) {
              all_m_d_c_m.push(j2)
              metalList.push(j2);

              jobwise_totals.metal.Wt += j2?.Wt;
              jobwise_totals.metal.Pcs += j2?.Pcs;
              jobwise_totals.metal.Rate += j2?.Rate;
              jobwise_totals.metal.Amount += j2?.Amount;
              jobwise_totals.metal.FineWt += j2?.FineWt;
              jobwise_totals.metal.length += 1;
              maintotal.metal.Wt += j2?.Wt;
              maintotal.metal.total_FineWt += +j2?.FineWt;
              maintotal.metal.FineWt += +j2?.FineWt;
              maintotal.metal.Pcs += j2?.Pcs;
              maintotal.metal.Rate += j2?.Rate;
              maintotal.metal.Amount += j2?.Amount;
              if (j2?.IsPrimaryMetal === 1) {
                jobwise_totals.metal.isPrimaryMetal = 1;
                jobwise_totals.metal.IsPrimaryMetal += j2?.Wt;
                jobwise_totals.metal.IsPrimaryMetal_Amount += j2?.Amount;
                jobwise_totals.primaryMetalPcs += j2?.Pcs;
                jobwise_totals.primaryMetalWt += j2?.Wt;
                // maintotal.metal.IsPrimaryMetal += j2?.Wt;
                maintotal.metal.IsPrimaryMetal += j2?.Wt;
                maintotal.metal.IsPrimaryMetal_Amount += j2?.Amount;

              }
              if(j2?.IsPrimaryMetal !== 1){
                jobwise_totals.metal.WithOutPrimaryMetal += j2?.Wt;
                maintotal.metal.withOutPrimaryMetal += j2?.Wt;
                jobwise_totals.metal.withoutPrimaryMetal_Amount += j2?.Amount;
                maintotal.metal.withoutPrimaryMetal_Amount += j2?.Amount;
              }
            }
            //for misc
            if (j2?.MasterManagement_DiamondStoneTypeid === 3) {

              if(j2?.IsHSCOE === 1 || j2?.IsHSCOE === 2 || j2?.IsHSCOE === 3){
                maintotal.misc.isHSCODE123_amt += j2?.Amount;
                jobwise_totals.misc.isHSCODE123_amt += j2?.Amount;
                miscList_IsHSCODE123.push(j2);
                if(j2?.IsHSCOE === 3){
                  jobwise_totals.misc.onlyIsHSCODE3_ServeWt += j2?.ServWt;
                  maintotal.misc.onlyIsHSCODE3_ServeWt += j2?.ServWt;
                }
              }
              if(j2?.IsHSCOE === 0){
                jobwise_totals.misc.onlyIsHSCODE0_Wt += j2?.Wt;
                jobwise_totals.misc.onlyIsHSCODE0_Pcs += j2?.Pcs;
                jobwise_totals.misc.onlyIsHSCODE0_Amount += j2?.Amount;
                maintotal.misc.onlyIsHSCODE0_Wt += j2?.Wt;
                maintotal.misc.onlyIsHSCODE0_Pcs += j2?.Pcs;
                maintotal.misc.onlyIsHSCODE0_Amount += j2?.Amount;
              }
              all_m_d_c_m.push(j2)
              if(j2?.isRateOnPcs === 0){
                israteonpcsMISC0.push(j2);
              }else{
                israteonpcsMISC1.push(j2);
              }
              miscList_duplicate.push(j2);
              maintotal.misc.allpcs += j2?.Pcs;
              maintotal.misc.allwt += j2?.Wt;
              maintotal.misc.allservwt += j2?.ServWt;
              jobwise_totals.misc.allservwt += j2?.ServWt;

              if(j2?.IsHSCOE === 3){
                jobwise_totals.misc.onlyHSCODE3_pcs += j2?.Pcs;
                jobwise_totals.misc.onlyHSCODE3_amt += j2?.Amount;
                maintotal.misc.onlyHSCODE3_pcs += j2?.Pcs;
                maintotal.misc.onlyHSCODE3_amt += j2?.Amount;
              }
              diamond_colorstone_misc_2_new?.push(j2);
              if (j2?.ShapeName === "Hallmark" || j2?.ShapeName === "Stamping") {
              } else {
                if(j2?.IsHSCOE === 0){
                  jobwise_totals.misc.withouthscode1_2_wt += j2?.Wt;
                  jobwise_totals.misc.withouthscode1_2_pcs += j2?.Pcs;
                  jobwise_totals.misc.withouthscode1_2_amount += j2?.Amount;
                  maintotal.misc.withouthscode1_2_pcs += j2?.Pcs;
                }
                  diamond_colorstone_misc?.push(j2);
              }
              miscList.push(j2);
              jobwise_totals.misc.Wt += j2?.Wt;
              jobwise_totals.misc.allwt += j2?.Wt;
              jobwise_totals.misc.Pcs += j2?.Pcs;
              jobwise_totals.misc.allpcs += j2?.Pcs;
              jobwise_totals.misc.Rate += j2?.Rate;
              jobwise_totals.misc.Amount += j2?.Amount;
              jobwise_totals.misc.FineWt += j2?.FineWt;
              jobwise_totals.misc.length += 1;
              maintotal.misc.Wt += j2?.Wt;
              maintotal.misc.total_FineWt += +j2?.FineWt;
              maintotal.misc.Pcs += j2?.Pcs;
              maintotal.misc.Rate += j2?.Rate;
              maintotal.misc.Amount += j2?.Amount;
              if (j2?.ShapeName === 'Hallmark' || j2?.ShapeName === 'Stamping' || j2?.ShapeName?.includes('Certification')) {
                jobwise_totals.otherChargesMiscHallStamp += j2?.Amount;
                maintotal.total_otherChargesMiscHallStamp += j2?.Amount;
              }

            }
            //for finding
            if (j2?.MasterManagement_DiamondStoneTypeid === 5) {
              all_m_d_c_m.push(j2)
              findingList.push(j2);
              jobwise_totals.finding.Wt += j2?.Wt;
              jobwise_totals.finding.Pcs += j2?.Pcs;
              jobwise_totals.finding.Rate += j2?.Rate;
              jobwise_totals.finding.Amount += j2?.Amount;
              jobwise_totals.finding.FineWt += j2?.FineWt;
              jobwise_totals.finding.SettingAmount += j2?.SettingAmount;
              jobwise_totals.finding.SettingRate += j2?.SettingRate;
              jobwise_totals.finding.length += 1;
              maintotal.finding.Wt += j2?.Wt;
              maintotal.finding.total_FineWt += +j2?.FineWt;
              maintotal.finding.Pcs += j2?.Pcs;
              maintotal.finding.Rate += j2?.Rate;
              maintotal.finding.Amount += j2?.Amount;
              maintotal.finding.SettingAmount += j2?.SettingAmount;
              maintotal.finding.SettingRate += j2?.SettingRate;
            }
            //for stone and misc
            if (
              j2?.MasterManagement_DiamondStoneTypeid === 2 ||
              j2?.MasterManagement_DiamondStoneTypeid === 3
            ) {
              stone_miscList.push(j2);
              jobwise_totals.stone_misc.Wt += j2?.Wt;
              jobwise_totals.stone_misc.Pcs += j2?.Pcs;
              jobwise_totals.stone_misc.Rate += j2?.Rate;
              jobwise_totals.stone_misc.Amount += j2?.Amount;
              maintotal.stone_misc.Wt += j2?.Wt;
              maintotal.stone_misc.total_FineWt += +j2?.FineWt;
              maintotal.stone_misc.Pcs += j2?.Pcs;
              maintotal.stone_misc.Rate += j2?.Rate;
              maintotal.stone_misc.Amount += j2?.Amount;
            }
            // if(j1?.LossWt !== 0){
            //   if(j2?.MasterManagement_DiamondStoneTypeid === 5){
            //     jobwise_totals.fineWtByMetalWtCalculation = (((j1?.NetWt * (j1?.Tunch + j1?.Wastage))/100) + ((j2?.FineWt)))
            //     // (((j2?.Wt * (j1?.Tunch + j1?.Wastage))/100) + ((j1?.NetWt * (j1?.Tunch + j1?.Wastage))/100))
            //   }
            // }
            jobwise_totals.makingAmount_settingAmount += j2?.SettingAmount;

            //ending of comparing of job no block
          }
        });
      diamond_colorstone_misc?.forEach((e) => {
        jobwise_totals.total_diamond_colorstone_misc_amount += +e?.Amount;
        maintotal.total_diamond_colorstone_misc_amount += +e?.Amount;
        maintotal.diamond_colorstone_misc.Amount += +e?.Amount;
        maintotal.diamond_colorstone_misc.Rate += +e?.Rate;
        maintotal.diamond_colorstone_misc.Wt += +e?.Wt;
        maintotal.diamond_colorstone_misc.Pcs += +e?.Pcs;
      });

      // diamond_colorstone_misc_2_new?.forEach((e) => {
      //   maintotal.total_diamond_colorstone_misc_amount += +e?.Amount;
      //   maintotal.diamond_colorstone_misc_2_new.Amount += +e?.Amount;
      //   maintotal.diamond_colorstone_misc_2_new.Rate += +e?.Rate;
      //   maintotal.diamond_colorstone_misc_2_new.Wt += +e?.Wt;
      //   maintotal.diamond_colorstone_misc_2_new.Pcs += +e?.Pcs;
      // });

      let obj = { ...j1 };
      obj.israteonpcsMISC0 = israteonpcsMISC0;
      obj.israteonpcsMISC1 = israteonpcsMISC1;
      diamond_colorstone_misc?.forEach((e) => {
        if (e?.ShapeName === "Certification_NM award") {
          jobnodup.push(e);
        }
      })
      let diawtdup = 0;
      diamond_colorstone_misc?.forEach((e) => {
        jobnodup?.forEach((a) => {
          if ((a?.StockBarcode === e?.StockBarcode) && e?.MasterManagement_DiamondStoneTypeid === 1) {
            diawtdup += e?.Wt;
          }
        })
      })

      diamondList?.sort((a, b) => a?.Rate - b?.Rate);
      colorstoneList?.sort((a, b) => a?.Rate - b?.Rate);


      jobwise_totals.makingAmount_settingAmount += j1?.MakingAmount;
      obj.diamond_colorstone_misc = diamond_colorstone_misc;
      obj.all_m_d_c_m = all_m_d_c_m;
      obj.miscList_IsHSCODE123 = miscList_IsHSCODE123;
      // obj.diamond_colorstone_misc_2_new = diamond_colorstone_misc_2_new;
      obj.certificateWtDia = diawtdup;
      obj.diamonds = diamondList;
      obj.colorstone = colorstoneList;
      obj.stone_misc = stone_miscList;
      obj.misc = miscList;
      obj.miscList_duplicate = miscList_duplicate;
      obj.metal = metalList;
      obj.finding = findingList;
      obj.totals = jobwise_totals;
      // obj.grouping_of_diamonds_sqc_jobwise = blankArrDiamond;
      // obj.grouping_of_colorstone_sqc_jobwise = blankArrColorstone;
      // obj.grouping_of_misc_sqc_jobwise = blankArrMisc;
      // obj.grouping_of_metal_sqc_jobwise = blankArrMetal;
      // obj.grouping_of_finding_sqc_jobwise = blankArrFinding;
      // obj.grouping_of_stone_misc_sqc_jobwise = blankArrstone_misc;
      // obj.diamondSettingGroup = diamondSettingGroup;
      // obj.colorstoneSettingGroup = colorstoneSettingGroup;
      // obj.diamondMetalPurityWise = diamondMetalPurityWise;
      // obj.colorstoneMetalPurityWise = colorstoneMetalPurityWise;
      obj.diamondWtMetalPurityWise = diamondWtMetalPurityWise;
      obj.colorstoneWtMetalPurityWise = colorstoneWtMetalPurityWise;
      obj.Making_Amount_Other_Charges = jobwise_totals.Making_Amount_Other_Charges;
      obj.other_details = other_details;
      obj.fineWtByMetalWtCalculation = jobwise_totals.fineWtByMetalWtCalculation;
      maintotal.total_MakingAmount_Setting_Amount += jobwise_totals.makingAmount_settingAmount;
      maintotal.total_fineWtByMetalWtCalculation += jobwise_totals.fineWtByMetalWtCalculation;
      obj.jobwise_dia_wt_certificate = 0

      resultArray.push(obj);
    });

  //totalAmount
  // let totalAmount = maintotal.total_amount + header?.AddLess + maintotal?.total_discount_amount ;
  // let totalAmount = maintotal.total_amount + header?.AddLess + header?.FreightCharges;
  let totalAmount = maintotal.total_amount;
  let allTax = taxGenrator(header, totalAmount);

  let brArr = [];
  if (header?.Brokerage?.length > 0) {
    let blankArr = header?.Brokerage?.split("@-@");
    let resultArr = [];
    blankArr.forEach((e, i) => {
      let obj = {};
      let arr = e?.split("#-#");
      obj.label = arr[0];
      obj.value = +(arr[1]);
      resultArr.push(obj);
    });
    
    brArr = resultArr;

  }
  allTax?.forEach((e) => {
    let amt = +(e?.amount);
    let cramt = ((amt)/(header?.CurrencyExchRate))
    e.amount = String(cramt);
  })
  //alltax
  allTax?.length > 0 &&
    allTax?.forEach((e) => {
      const [dollars, cents] = (((e?.amount)))?.split(".");
      const dollarsInWords = numberToWords.toWords(parseInt(dollars));
      const centsInWords = cents
        ? numberToWords.toWords(parseInt(cents.padEnd(2, '0')))
        : "Zero";
      const amountInWords = [
        dollarsInWords.charAt(0).toUpperCase() + dollarsInWords.slice(1),
        "point",
        centsInWords.charAt(0).toUpperCase() + centsInWords.slice(1),
      ]
        .filter(Boolean)
        .join(" ");
      let amtInWords = CapitalizeWords((amountInWords))
      e.amountInWords = `TOTAL ${e.name} IN WORDS: ${amtInWords}`;
    });
  allTax?.forEach((e) => {
    totalAmount += (+e?.amount);
  })
  
  allTax?.forEach((e) => {
    let amtwords = toWords?.convert(+((+e?.amount)?.toFixed(2)));
    let amtInWords = CapitalizeWords(amtwords)
    // e.amountInWords = amtwords;
    e.amountInWords = `TOTAL ${e.name} IN WORDS: ${amtInWords}`;
  })
  
  totalAmount = (+totalAmount)?.toFixed(2);
  totalAmount = (+totalAmount) + (+header?.AddLess);
  // totalAmount = (+totalAmount) + (+header?.AddLess) + (+header?.FreightCharges);

  let headerObj = { ...header };

  headerObj.BrokerageDetails = brArr;

  // resultArray.sort((a, b) => a.designno - b.designno);
  const customSort = (a, b) => {

    if (isNaN(a?.designno) && isNaN(b?.designno)) {
      // If both are non-numeric, compare as strings
      return (a?.designno)?.localeCompare(b?.designno);
    } else if (isNaN(a?.designno)) {
      // If only 'a' is non-numeric, place it at the end
      return 1;
    } else if (isNaN(b?.designno)) {
      // If only 'b' is non-numeric, place it at the end
      return -1;
    } else {
      // If both are numeric, compare as numbers
      return a?.designno - b?.designno;
    }
  };

  resultArray?.sort(customSort);

  // organizeDiamonds.sort((a, b) => {
  //   if (a.shapeColorQuality === "OTHER") return 1; // "OTHER" values go to the end
  //   if (b.shapeColorQuality === "OTHER") return -1; // "OTHER" values go to the end
  //   return a.shapeColorQuality.localeCompare(b.shapeColorQuality); // Sort alphabetically
  // });
  let allTaxTotal = 0;

const allTaxes = allTax?.map((e) => {
      let obj = {...e};
      obj.amountInNumber = +e?.amount;
      allTaxTotal += +e?.amount;
      return obj;
  })
  let finalArr = [];
  resultArray?.forEach((e) => {
    let obj = {...e};
    let metal_rate = e?.metal?.reduce((acc, val) => acc + val?.Rate, 0);
    obj.metal_rate = metal_rate;
    let primary_metal_rate = e?.metal?.reduce((acc, val) => ( val?.IsPrimaryMetal === 1 ?  (acc + val?.Rate) : acc), 0);
    obj.primary_metal_rate = primary_metal_rate;

    let other_details_arr_total_amount = 0;

     other_details_arr_total_amount = obj?.other_details?.reduce((acc, num) => acc + num?.amtval, 0);
    
    obj.other_details_arr_total_amount = other_details_arr_total_amount;

    obj.discountOn = discountCriteria(e);
    
    finalArr.push(obj);
  })
  const finalObject = {
    // resultArray: resultArray,
    resultArray: finalArr,
    mainTotal: maintotal,
    finalAmount: +totalAmount,
    allTaxes: allTaxes,
    allTaxesTotal : allTaxTotal,
    header: headerObj,
    json1: json1,
    json2: json2,
    json3: json3 || []
    // organizeDiamonds: organizeDiamonds,
  };
  return finalObject;
};
