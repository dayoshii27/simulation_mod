$(document).ready(function() {

  var selected_option;
  var type, fromDate, toDate, duration, how_many, rank, plan, sim, shipping;
  var validation;
  var savedStartDate;
  var savedEndDate;
  var initialPrice;
  var monthlyPrice;
  var shippingFee;
  var sum;
  var simulateStatus = 'undecided';

  // 初期費用
  const initial = {
    simple: 1000,
    nolimi: 2000,
    smartA: 1500,
    smartB: 3000,
    smartC: 4000,
    smartNew: 6000,
    wifi: 1000,
    nosim: 0,
    sb5: 1500,
    doc5: 4000,
    sb20: 3000
  };
  // レンタル費用（月額）
  const monthly = {
    simple: 100,
    nolimi: 300,
    smartA: 150,
    smartB: 300,
    smartC: 400,
    smartNew: 600,
    wifi: 200,
    nosim: 0,
    sb5: 200,
    doc5: 300,
    sb20: 200
  }
  // 送料
  const ship = {
    general: 1000,
    okinawa: 2500,
    inshop: 0
  }
  // テキスト
  const temp_text = [
    '1以上の数字を半角で入力してください。',
    '-- レンタル機器を選択してください --',
    [
      '-- 端末のランクを選択してください --',
      '-- プランを選択してください --'
    ],
    '-- レンタル日数を入力してください --',
    '-- SIMカードの有無を選択してください --',
    '-- 送料 --'
  ]

  ////// Initialize //////
  //初期値に当日の日付を設定
  resetDate();
  // 選択１以外非表示
  $('.select').hide();
  $('.select1').show();

  // 選択肢開閉
  closeSelect();
  $('.select_initial').click(function() {
    $(this).toggleClass('open');
    $(this).next('ul').toggle();
  });
  $('.select3 .select_initial').click(function() {
    if($(this).hasClass('open')) {
      var focusTarget = $(this).next('p').children('input');
      focusTarget.focus();
    }
  });
  $(document).on('click touchend', function(event) {
    if (!$(event.target).closest('.select_initial, .select3 input, .select li').length) {
      closeSelect();
    }
  });

  // 選んだ質問以降の質問はやり直し
  $('.select1 .select_initial').click(function() {reset1();});

  ////// 選択肢決定 //////
  $('.select li').click(function() {
    selected_option = $(this).text();
    $(this).parent('ul').prev('.select_initial').text(selected_option);
    closeSelect();
    $(this).parent('ul').hide();
  });

  ////// 選択１ //////
  $('.select1 li').click(function() {
    type = $(this).attr('data-type');
    switch (type) {
      case 'smart':
        $('.select2-1').fadeIn();
        break;
      case 'mobile':
        $('.select2-2').show();
        $('.select2-2').find('ul li').click();
        break;
      case 'wifi':
        $('.select3').fadeIn();
        break;
    }
    simulateStatus = 'undecided';
    resetPrice();
    showPrice();
  });

  ////// 選択２ //////
  $('.select2-1 li, .select2-2 li').click(function() {
    if($(this).hasClass('rank')) {
      rank = $(this).attr('data-rank');
    } else {
      plan = $(this).attr('data-plan');
    }
    if(simulateStatus === 'decided') {
      calculatePrice();
      showPrice();
    }
    $('.select3').fadeIn();
  });

  ////// 選択３ //////
  //フォーカスで、バリデーション用に一時的に値を保持
  $('.select3 input').focus(function() {
    saveValue($(this));
  });
  $('.select3 input').change(function() {
    if(simulateStatus === 'undecided') {
      $('.select3-2 input').val($('.select3 input').val())
    }
    setDate();
    closeSelect();
    notBeforeToday();
    if(validation === 'clear') {
      if(duration < 1) {
        $(this).val(savedStartDate);
        $('.select3').append('<p class="warning">レンタル終了日より前の日付を選択して下さい。</p>');
      } else {
        $('.select3-2').fadeIn();
        if(simulateStatus === 'decided') {
          calculatePrice();
          showPrice();
        }
      }
    }
  });

  ////// 選択３-2 //////
  //フォーカスで、バリデーション用に一時的に値を保持
  $('.select3-2 input').focus(function() {
    saveValue($(this));
  });
  $('.select3-2 input').change(function() {
    setDate();
    closeSelect();
    if(duration < 1) {
      $(this).val(savedEndDate);
      $('.select3-2').append('<p class="warning">レンタル開始日以降の日付を選択して下さい。</p>');
    } else {
      $('.select3-3').fadeIn();
      if(simulateStatus === 'decided') {
        calculatePrice();
        showPrice();
      }
    }
  });

  ////// 選択3-3 //////
  for (var i=0; i<51; i++) {
    $('#how_many').append('<option>'+ i +'</option>');
  } // 台数分の<option>タグを追加
  $('.select3-3 select option:first-child').prop('disabled', true); //初期値で表示している0は選択不可

  $('.select3-3 select').change(function() {
    closeSelect();
    how_many = htmlspecialchars($(this).val());
    if(type == 'smart') {
      $('.select4').fadeIn();
    } else {
      $('.select5').fadeIn();
    }
    if(simulateStatus === 'decided') {
      calculatePrice();
      showPrice();
    }
  });

  ////// 選択４ //////
  $('.select4 li').click(function() {
    sim = $(this).attr('data-sim');
    if(simulateStatus === 'decided') {
      calculatePrice();
      showPrice();
    }
    $('.select4-2').fadeIn();
  });

  ////// 選択４-2 //////
  $('.select4-2 li').click(function() {

    if(simulateStatus === 'decided') {
      calculatePrice();
      showPrice();
    }
    $('.select5').fadeIn();
  });

  ////// 選択５ -> 結果表示 //////
  $('.select5 li').click(function() {
    shipping = $(this).attr('data-shipping');
    calculatePrice();
    showPrice();
    simulateStatus = 'decided';
  });

  ////// functions //////
  // Initialize data function
  function reset1() {
    simulateStatus = 'undecided';
    type = '';
    duration = 1;
    how_many = 0;
    rank = '';
    plan = '';
    sim = '';

    $('.select3-3 select option:first-child').prop('selected',true);
    $('.select2-1 .select_initial').text(temp_text[2][0]);
    $('.select2-2 .select_initial').text(temp_text[2][1]);
    $('.select3 input').val('');
    $('.select4 .select_initial').text(temp_text[4]);
    $('.select5 .select_initial').text(temp_text[5]);
    $('.select2-1,.select2-2,.select3, .select3-2, .select3-3, .select4,.select5').hide();
    resetDate();
  }

  function closeSelect() {
    $('.select_initial').next('ul').hide();
    $('.select_initial').removeClass('open');
    $('.warning').hide();
  }

  //初期値に当日の日付を設定
  function resetDate() {
    var today = new Date();
    var todayDate = formatDate(today, 'YYYY/MM/DD');
    $('.select3 input, .select3-2 input').val(todayDate);
    $('.select3 input, .select3-2 input').attr('placeholder', todayDate);
  }

  // exclusive closeSelect
  $('.select_initial').click(function() {
    $(this).parent().siblings('.select').find('.select_initial').next('ul').hide();
    $(this).parent().siblings('.select').find('.select_initial').next('p').hide();
    $(this).parent().siblings('.select').find('.select_initial').removeClass('open');
    $('.warning').hide();
  });

  // 料金計算
  function calculatePrice() {
    resetPrice();
    switch (type) {
      case 'mobile':
        if(plan == 'simple') {
          initialPrice += initial.simple;
          monthlyPrice += monthly.simple;
        } else if(plan == 'nolimi') {
          initialPrice += initial.nolimi;
          monthlyPrice += monthly.nolimi;
        }
        break;
      case 'smart':
        switch (rank) {
          case 'a':
            initialPrice += initial.smartA;
            monthlyPrice += monthly.smartA;
            break;
          case 'b':
            initialPrice += initial.smartB;
            monthlyPrice += monthly.smartB;
            break;
          case 'c':
            initialPrice += initial.smartC;
            monthlyPrice += monthly.smartC;
            break;
          case 'new':
            initialPrice += initial.smartNew;
            monthlyPrice += monthly.smartNew;
            break;
        }
        switch (sim) {
          case 'nosim':
            initialPrice += initial.nosim;
            monthlyPrice += monthly.nosim;
            break;
          case 'sb5':
            initialPrice += initial.sb5;
            monthlyPrice += monthly.sb5;
            break;
          case 'doc5':
            initialPrice += initial.doc5;
            monthlyPrice += monthly.doc5;
            break;
          case 'sb20':
            initialPrice += initial.sb20;
            monthlyPrice += monthly.sb20;
            break;
        }
        break;
      case 'wifi':
        initialPrice += initial.wifi;
        monthlyPrice += monthly.wifi;
        break;
    }
    switch (shipping) {
      case 'general':
        shippingFee = ship.general;
        break;
      case 'okinawa':
        shippingFee = ship.okinawa;
        break;
      case 'inshop':
        shippingFee = ship.inshop;
        break;
    }
    initialPrice *= how_many; //初期費用 = 初期費用 x 台数
    monthlyPrice = monthlyPrice * duration * how_many; //月額合計 = 月額 x 日数 x 台数
    sum = initialPrice + monthlyPrice + shippingFee; // 合計金額 = 初期費用 + 月額合計 + 送料
  }

  // 内訳と合計金額表示
  function showPrice() {
    initialPrice = Number(initialPrice).toLocaleString();
    monthlyPrice = Number(monthlyPrice).toLocaleString();
    shippingFee = Number(shippingFee).toLocaleString();
    sum = Number(sum).toLocaleString();
    $('span.initialPrice').text(initialPrice);
    $('span.monthlyPrice').text(monthlyPrice);
    $('span.shippingFee').text(shippingFee);
    $('span.sum').text(sum);
  }

  //内訳と合計金額表示リセット
  function resetPrice() {
    $('span.initialPrice').text(0);
    $('span.monthlyPrice').text(0);
    $('span.shippingFee').text(0);
    $('span.sum').text(0);
    initialPrice = 0;
    monthlyPrice = 0;
    shippingFee = 0;
    sum = 0;
  }

  // タグ無効
  function htmlspecialchars(str){
    return (str + '')
     .replace(/&/g,'&amp;')
     .replace(/"/g,'&quot;')
     .replace(/'/g,'&#039;')
     .replace(/</g,'&lt;')
     .replace(/>/g,'&gt;');
  }

  // レンタル期間計算
  function setDate(){
      fromDate = new Date($('.select3 input').val() );
      toDate = new Date($('.select3-2 input').val() );
      if (!toDate.getDate()){
          var year = fromDate.getFullYear().toString();
          var mm = (fromDate.getMonth() + 1).toString();
          var dd = fromDate.getDate().toString();
          var yyyymmdd = year + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + (dd[1]?dd:"0"+dd[0]);
          $('.select3-2 input').val(yyyymmdd);
          toDate = new Date($('.select3-2 input').val() );
      }
      var days = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000);
      duration = days + 1;
  }

  // 当日以前の日付選択不可
  function notBeforeToday() {
    today = new Date();
    today.setHours(0, 0, 0, 0);
    var selectedStartDate = new Date($('.select3 input').val());
    var diff = Math.round((selectedStartDate - today) / 1000 / 60 / 60 / 24);
    if (diff < 0) {
      $('.select3 p.warining').remove();
      $('.select3').append('<p class="warning">今日以降の日付を入力してください。</p>');
      $('.select3 input').val(savedStartDate);
      validation = 'failed';
    } else {
      validation = 'clear';
    }
  }

  //validationをクリアするまで値を保持
  function saveValue(target) {
    savedStartDate = target.val();
    savedEndDate = target.val();
  }

  //日付のフォーマット
  function formatDate(date, format) {
    var year = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
    var yyyymmdd = year + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + (dd[1]?dd:"0"+dd[0]);
    return yyyymmdd;
  }

  //日付0詰
  function yyyymmdd(y, m, d) {
    var y0 = ('0000' + y).slice(-4);
    var m0 = ('00' + m).slice(-2);
    var d0 = ('00' + d).slice(-2);
    return y0 + m0 + d0;
  }


});
