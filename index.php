<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Train Simulator DC</title>
    <link rel="icon" type="image/png" sizes="64x64" href="http://trainsim.dc/icon/icon.png">
    <link rel="stylesheet" type="text/css" href="http://trainsim.dc/basic.css">
</head>
<body>

<div class="GameWindow">
    <div class="modal" id="MainMenu" on="1">
        <div class="MM_Background">
            <div class="MM_Block">
                <div class="MM_PodBlock" id="MM_Maps" style="border: 1px solid grey;">

                </div>
                <div class="MM_PodBlock" id="MM_Desc" style="margin-left: 45%;">

                </div>
            </div>
        </div>
    </div>
    <div class="modal" id="BasicGame">
        <div id="BasicView"></div>
        <div id="BasicGrow"></div>
        <div id="BasicTrain"></div>
        <div id="NextPointBar"></div>
        <div id="NextPointBar2"></div>
        <span id="SPB_full">
            <div id="SpeedBar"></div>
            <div id="SpeedPodBar"></div>
            <div id="SpeedInBar"></div>
            <div id="SpeedUnderBar"></div>
            <div id="SBP1">0</div>
            <div id="SBP2"></div>
            <div id="SBP3"></div>
            <div id="SBP4"></div>
            <div id="SBP5"></div>
            <div id="MaxSpeedPoint"></div>
        </span>
        <div id="TextBlock"></div>
    </div>
</div>

</body>
<script src="http://trainsim.dc/work.js"></script>