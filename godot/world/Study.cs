using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using Studio.Foundation;
using Studio.Foundation.GodotRuntime;
namespace A16;
public partial class Study : Node3D {
    Session game;
    SingleSaveFile<StudySnapshot> store;
    readonly Dictionary<string,CardItem> items=new();
    Node3D itemRoot;
    CharacterBody3D player;
    Camera3D roomCamera,deskCamera;
    CardItem held;
    Vector3 origin;
    string originPlace;
    Label status,hint,legend,pageLabel;
    HBoxContainer targets;
    PanelContainer pausePanel;
    ConfirmationDialog restart;
    MeshInstance3D ghost,binder;
    OmniLight3D hintLight;
    AudioStreamPlayer sound;
    bool atDesk,paused,painting,busy,canSave=true,capture;
    Vector3? testPoint;
    float yaw,pitch,saveTimer,noticeTimer,hintTimer;
    string notice="";
    Tween motion;
    static readonly Vector3 CleanPoint=new(-2.1f,1.15f,-2.6f),PuzzlePoint=new(0,1.15f,-2.6f),BinderPoint=new(2.1f,1.23f,-2.6f);
    public override void _Ready() {
        ProcessMode=ProcessModeEnum.Always;
        var args=OS.GetCmdlineUserArgs();
        if(args.Contains("--smoke")) {
            try {Session.Smoke();GetTree().Quit(0);}catch(Exception e){GD.PushError(e.ToString());GetTree().Quit(1);}return;
        }
        GetTree().AutoAcceptQuit=false;
        capture=args.Contains("--capture")||args.Contains("--capture-room");game=new Session((int)(Time.GetTicksMsec()%100000));
        store=new(ProjectSettings.GlobalizePath("user://godot-study-v1.json"),new StudyCodec());
        if(!capture && !args.Contains("--no-save") && !args.Contains("--flow-test")) {
            var read=store.Inspect();
            if(read.CanContinue)game.Restore(read.Snapshot);
            else if(read.Status!=SaveStatus.Missing){canSave=false;ShowNotice("样板存档不可读取，本轮不会覆盖："+read.Status);}
        } else canSave=false;
        Room.Build(this);
        itemRoot=new Node3D{Name="Items",ProcessMode=ProcessModeEnum.Pausable};AddChild(itemRoot);
        BuildPlayer();BuildStations();BuildUi();
        sound=new AudioStreamPlayer{VolumeDb=-18};AddChild(sound);
        hintLight=new OmniLight3D{LightColor=new Color("8cf4df"),LightEnergy=2,OmniRange=1.4f,Visible=false};AddChild(hintLight);
        foreach(var state in game.Data.Items)Spawn(state);
        UpdateStations();
        if(capture){if(!args.Contains("--capture-room")){StageCapture();SetDesk(true);}CaptureSoon();}else Input.MouseMode=Input.MouseModeEnum.Captured;
        if(args.Contains("--flow-test"))FlowTest();
    }
    void BuildPlayer() {
        player=new CharacterBody3D{Position=new(game.Data.Player[0],game.Data.Player[1],game.Data.Player[2]),ProcessMode=ProcessModeEnum.Pausable,CollisionLayer=4,CollisionMask=1};
        player.AddChild(new CollisionShape3D{Shape=new CapsuleShape3D{Radius=.26f,Height=1.8f}});AddChild(player);
        roomCamera=new Camera3D{Position=new(0,.72f,0),Fov=72,Current=true,Near=.05f};player.AddChild(roomCamera);
        deskCamera=new Camera3D{Position=new(0,5.4f,.4f),Fov=58,Near=.05f};AddChild(deskCamera);deskCamera.LookAt(new(0,1,-2.55f));
        yaw=game.Data.Yaw;pitch=game.Data.Pitch;player.Rotation=new(0,yaw,0);roomCamera.Rotation=new(pitch,0,0);
    }
    void BuildStations() {
        ghost=new MeshInstance3D{Position=new(0,1.112f,-2.6f),Mesh=new PlaneMesh{Size=new(CardItem.CardWidth,CardItem.CardHeight)}};AddChild(ghost);
        binder=new MeshInstance3D{Position=BinderPoint+Vector3.Up*.015f,Mesh=new PlaneMesh{Size=new(.34f,.49f)}};AddChild(binder);
    }
    static StyleBoxFlat PanelStyle() => new(){BgColor=new Color(.045f,.10f,.105f,.93f),BorderColor=new Color("a38e62"),BorderWidthBottom=1,CornerRadiusBottomLeft=10,CornerRadiusBottomRight=10,CornerRadiusTopLeft=10,CornerRadiusTopRight=10,ContentMarginLeft=18,ContentMarginRight=18,ContentMarginTop=12,ContentMarginBottom=12};
    static Label Text(string text,int size=18) => new(){Text=text,Theme=new Theme{DefaultFontSize=size},MouseFilter=Control.MouseFilterEnum.Ignore};
    Button Button(string text,Action action) {var b=new Button{Text=text,CustomMinimumSize=new(100,35)};b.Pressed+=action;return b;}
    void BuildUi() {
        var canvas=new CanvasLayer();AddChild(canvas);
        var ui=new Control{MouseFilter=Control.MouseFilterEnum.Ignore};ui.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);canvas.AddChild(ui);
        var theme=new Theme{DefaultFont=new SystemFont{FontNames=new string[]{"Microsoft YaHei"}},DefaultFontSize=17};ui.Theme=theme;
        var top=new PanelContainer{Position=new(24,22),Size=new(620,110),MouseFilter=Control.MouseFilterEnum.Ignore};top.AddThemeStyleboxOverride("panel",PanelStyle());ui.AddChild(top);
        var topBox=new VBoxContainer();top.AddChild(topBox);var title=Text("碎 光 收 藏 室",25);title.AddThemeColorOverride("font_color",new Color("e4c990"));topBox.AddChild(title);
        status=Text("");topBox.AddChild(status);pageLabel=Text("三张卡的流程样板 · 美术仍在审阅",14);topBox.AddChild(pageLabel);
        targets=new HBoxContainer{AnchorLeft=1,AnchorRight=1,OffsetLeft=-440,OffsetRight=-24,OffsetTop=24,OffsetBottom=64};ui.AddChild(targets);
        for(int c=0;c<3;c++){int id=c;targets.AddChild(Button(Session.Names[c],()=>{game.Data.Target=id;UpdateStations();}));}
        var bottom=new PanelContainer{AnchorTop=1,AnchorBottom=1,AnchorRight=1,OffsetLeft=24,OffsetRight=-24,OffsetTop=-109,OffsetBottom=-22,MouseFilter=Control.MouseFilterEnum.Ignore};bottom.AddThemeStyleboxOverride("panel",PanelStyle());ui.AddChild(bottom);
        var box=new VBoxContainer();bottom.AddChild(box);hint=Text("",19);hint.AddThemeColorOverride("font_color",new Color("e9d5aa"));box.AddChild(hint);legend=Text("",15);box.AddChild(legend);
        var cross=Text("·",34);cross.AnchorLeft=.5f;cross.AnchorTop=.5f;cross.OffsetLeft=-5;cross.OffsetTop=-20;ui.AddChild(cross);
        pausePanel=new PanelContainer{AnchorLeft=.5f,AnchorTop=.5f,OffsetLeft=-200,OffsetTop=-145,OffsetRight=200,OffsetBottom=145,Visible=false};pausePanel.AddThemeStyleboxOverride("panel",PanelStyle());ui.AddChild(pausePanel);
        var menu=new VBoxContainer();pausePanel.AddChild(menu);menu.AddChild(Text("暂停整理",25));menu.AddChild(Button("继续整理",()=>Pause(false)));menu.AddChild(Button("重新开始样板",()=>restart.PopupCentered()));menu.AddChild(Button("保存并退出",()=>{Save();GetTree().Quit();}));
        restart=new ConfirmationDialog{Title="重新开始",DialogText="重新开始将重新分布卡牌，并覆盖当前整理进度。是否继续？",OkButtonText="确认重新开始",CancelButtonText="取消"};canvas.AddChild(restart);
        restart.Confirmed+=()=>{if(motion!=null&&motion.IsValid())motion.Kill();Pause(false);held=null;busy=false;game.Reset((int)(Time.GetTicksMsec()%100000)); // Preserve the physical save generation while replacing domain payload.
            var old=store.Inspect();if(old.CanContinue)game.Restore(game.Data with {Revision=old.Snapshot.Revision,WriteToken=old.Snapshot.WriteToken});
            NodeHelpers.QueueFreeChildren(itemRoot);items.Clear();foreach(var state in game.Data.Items)Spawn(state);UpdateStations();Save();};
    }
    void Spawn(ItemState state) {
        if(state.Place=="held")state.Place="desk";
        var card=new CardItem();itemRoot.AddChild(card);card.Setup(state);items.Add(state.Id,card);Apply(card);
    }
    Vector3 Slot(int p)=>PuzzlePoint+new Vector3((p%2-.5f)*CardItem.CardWidth/2,0,(p/2-1)*CardItem.CardHeight/3);
    void Apply(CardItem item) {
        string place=item.State.Place;item.Visible=place is not ("container" or "archived" or "assembled");
        if(place=="puzzle") {item.Visible=item.State.Card==game.Data.Target;item.SetPlace(Slot(item.State.Piece),true);}
        else if(place=="clean")item.SetPlace(CleanPoint,true);
        else if(place is "container" or "archived" or "assembled")item.Freeze=true;
        else item.Freeze=false;
        item.CollisionLayer=item.Visible?2u:0u;
    }
    void UpdateStations() {
        ghost.MaterialOverride=new StandardMaterial3D{AlbedoTexture=GD.Load<Texture2D>($"res://assets/{Session.Art[game.Data.Target]}.png"),AlbedoColor=new Color(1,1,1,.23f),Transparency=BaseMaterial3D.TransparencyEnum.Alpha,Roughness=.9f};
        binder.Visible=game.Data.Archived.Contains(game.Data.Page);binder.MaterialOverride=new StandardMaterial3D{AlbedoTexture=GD.Load<Texture2D>($"res://assets/{Session.Art[game.Data.Page]}.png"),Roughness=.55f};
        foreach(var item in items.Values)if(item.State.Place is "puzzle" or "archived" or "assembled")Apply(item);
        if(pageLabel!=null)pageLabel.Text=$"拼接：{Session.Names[game.Data.Target]}   ·   收卡设备 第 {game.Data.Page+1}/3 页";
    }
    public override void _PhysicsProcess(double delta) {
        if(game==null||paused||atDesk)return;
        var move=Vector3.Zero;if(Input.IsPhysicalKeyPressed(Key.W))move.Z--;if(Input.IsPhysicalKeyPressed(Key.S))move.Z++;if(Input.IsPhysicalKeyPressed(Key.A))move.X--;if(Input.IsPhysicalKeyPressed(Key.D))move.X++;
        move=player.Basis*move.Normalized();var velocity=move*3.2f;velocity.Y=player.Velocity.Y-14*(float)delta;player.Velocity=velocity;player.MoveAndSlide();
    }
    public override void _Process(double delta) {
        if(game==null||paused)return;
        if(held!=null&&!busy)held.GlobalPosition=TablePoint()+Vector3.Up*.22f;
        var (aim,point)=Ray();
        if(painting&&atDesk&&aim!=null&&aim.State.Place=="clean"&&aim.State.Front&&aim.State.Dirty) {
            float ratio=aim.Paint(point);ShowNotice(ratio>=1?"清理完成，左键拿走":"清理中  "+Mathf.RoundToInt(ratio*100)+"%",.2f);
            if(ratio>=1){Tone(880);Save();}
        }
        noticeTimer-=(float)delta;hintTimer-=(float)delta;hintLight.Visible=hintTimer>0;
        status.Text=$"容器 {game.Carried}/{game.Capacity}   ·   已归档 {game.Data.Archived.Count}/3"+(game.Data.Archived.Count==3?"   ·   整理完成，可自由查看":"");
        targets.Visible=atDesk;
        legend.Text=atDesk?"左键 拿取/放置/按住擦拭   ·   右键 翻面   ·   B 整批倒出   ·   Tab 切换拼图   ·   PgUp/PgDn 翻页   ·   F 快捷归位   ·   I 欣赏   ·   E 离开":"WASD 移动   ·   鼠标 观察   ·   左键 收集   ·   F 翻面   ·   E 工作台   ·   H 位置提示   ·   Esc 暂停";
        hint.Text=noticeTimer>0?notice:held!=null?"拿着 "+Session.Names[held.State.Card]+(held.State.Piece>=0?$" · 碎片 {held.State.Piece+1}":""):aim!=null?Session.Names[aim.State.Card]+(aim.State.Dirty?" · 有污渍":" · 干净")+(aim.State.Front?" · 正面":" · 背面")+(aim.State.Place=="clean"?" · 按住擦拭 / Shift＋左键拿起":""):atDesk?"把物品放到清理区、拼接区或收卡设备":"在收藏室寻找散落的卡牌与碎片";
        saveTimer+=(float)delta;if(saveTimer>2){saveTimer=0;Save();}
    }
    public override void _UnhandledInput(InputEvent input) {
        if(game==null)return;
        if(input is InputEventKey key&&key.Pressed&&!key.Echo) {
            if(key.PhysicalKeycode==Key.Escape){Pause(!paused);return;}if(paused)return;
            switch(key.PhysicalKeycode) {
                case Key.E: if(atDesk)SetDesk(false);else if(player.GlobalPosition.DistanceTo(new(0,.9f,-1.3f))<3.5f)SetDesk(true);else ShowNotice("请靠近工作台再交互");break;
                case Key.B: if(atDesk)Dump();break;
                case Key.F: if(atDesk&&held!=null)ArchiveHeld(true);else Flip(Ray().Item1);break;
                case Key.Tab: if(atDesk){game.Data.Target=(game.Data.Target+1)%3;UpdateStations();}break;
                case Key.Pageup: if(atDesk){game.Data.Page=(game.Data.Page+2)%3;UpdateStations();}break;
                case Key.Pagedown: if(atDesk){game.Data.Page=(game.Data.Page+1)%3;UpdateStations();}break;
                case Key.H: Hint();break;
                case Key.I: if(atDesk)Inspect();break;
            }
        }
        if(paused)return;
        if(input is InputEventMouseMotion mouse&&!atDesk) {yaw-=mouse.Relative.X*.0024f;pitch=Mathf.Clamp(pitch-mouse.Relative.Y*.0024f,-1.4f,1.3f);player.Rotation=new(0,yaw,0);roomCamera.Rotation=new(pitch,0,0);}
        if(input is InputEventMouseButton button) {
            if(button.ButtonIndex==MouseButton.Left&&!button.Pressed)painting=false;
            if(!button.Pressed||busy)return;
            if(button.ButtonIndex==MouseButton.Right&&atDesk){Flip(held??Ray().Item1);return;}
            if(button.ButtonIndex!=MouseButton.Left)return;
            if(!atDesk){var item=Ray().Item1;if(item!=null&&game.Collect(item.State)){Apply(item);Tone(520);Save();}else if(item!=null)ShowNotice("容器已满，请返回工作台");return;}
            if(held!=null){Drop();return;}
            var (card,point)=Ray();if(card==null)return;
            if(card.State.Place=="clean"&&card.State.Front&&card.State.Dirty&&!button.ShiftPressed){painting=true;card.Paint(point);return;}
            if(card.State.Place=="puzzle"){ShowNotice("正确拼入的碎片已经固定");return;}
            Take(card);
        }
    }
    (CardItem,Vector3) Ray() {
        var cam=atDesk?deskCamera:roomCamera;var mouse=atDesk?GetViewport().GetMousePosition():GetViewport().GetVisibleRect().Size/2;
        var from=cam.ProjectRayOrigin(mouse);var to=from+cam.ProjectRayNormal(mouse)*(atDesk?25:3.8f);
        var query=PhysicsRayQueryParameters3D.Create(from,to,atDesk?2u:3u);var result=GetWorld3D().DirectSpaceState.IntersectRay(query);
        if(result.Count==0)return(null,Vector3.Zero);return(result["collider"].AsGodotObject() as CardItem,result["position"].AsVector3());
    }
    Vector3 TablePoint() {if(testPoint.HasValue)return testPoint.Value;var mouse=GetViewport().GetMousePosition();var ray=deskCamera.ProjectRayNormal(mouse);var from=deskCamera.ProjectRayOrigin(mouse);float distance=(1.15f-from.Y)/ray.Y;var p=from+ray*distance;return new(Mathf.Clamp(p.X,-3.8f,3.8f),1.15f,Mathf.Clamp(p.Z,-4.2f,-.8f));}
    void SetDesk(bool value) {if(held!=null)ReturnHeld("");atDesk=value;painting=false;roomCamera.Current=!value;deskCamera.Current=value;Input.MouseMode=value?Input.MouseModeEnum.Visible:Input.MouseModeEnum.Captured;ShowNotice(value?"B 将容器内容整批倒到桌上":"已离开工作台");}
    void Flip(CardItem item) {if(item==null||item.State.Place is "puzzle" or "assembled" or "archived")return;item.Face(!item.State.Front);Tone(410);Save();}
    void Dump() {if(held!=null||busy)return;int n=0;foreach(var item in items.Values.Where(c=>c.State.Place=="container")){item.State.Place="desk";item.Visible=true;item.CollisionLayer=2;item.SetPlace(new(-2.9f+GD.Randf()*5.8f,1.30f+n*.045f,-1.68f+GD.Randf()*.23f),false);n++;}ShowNotice(n>0?$"已倒出 {n} 个对象，可自由整理":"容器目前为空");Tone(330);Save();}
    void Take(CardItem item) {origin=item.GlobalPosition;originPlace=item.State.Place;held=item;item.State.Place="held";item.Freeze=true;item.CollisionLayer=0;}
    void ReturnHeld(string message) {if(held==null)return;var card=held;held=null;card.State.Place=originPlace;card.SetPlace(origin,originPlace=="clean");card.CollisionLayer=2;if(message.Length>0)ShowNotice(message);}
    void Drop() {
        var p=TablePoint();var item=held;
        if(Mathf.Abs(p.X-CleanPoint.X)<.75f&&Mathf.Abs(p.Z-CleanPoint.Z)<.86f) {
            if(items.Values.Any(c=>c!=item&&c.State.Place=="clean")){ReturnHeld("清理区一次只放一个对象");return;}
            item.State.Place="clean";item.SetPlace(CleanPoint,true);item.CollisionLayer=2;held=null;Save();return;
        }
        if(Mathf.Abs(p.X)<.68f&&Mathf.Abs(p.Z-PuzzlePoint.Z)<.88f) {
            int best=0;float d=100;for(int i=0;i<6;i++){float distance=p.DistanceTo(Slot(i));if(distance<d){d=distance;best=i;}}
            if(d>.33f||!game.PlacePiece(item.State,game.Data.Target,best,out bool made)){ReturnHeld("需要翻正、清理，并放到对应卡牌的位置");return;}
            held=null;Apply(item);if(made){var state=game.Data.Items.Last();Spawn(state);ShowNotice("拼接完成，手动拿起完整卡去归档");}Tone(730);UpdateStations();Save();return;
        }
        if(Mathf.Abs(p.X-BinderPoint.X)<.85f&&Mathf.Abs(p.Z-BinderPoint.Z)<.9f){ArchiveHeld(false);return;}
        held=null;item.State.Place="desk";item.CollisionLayer=2;item.SetPlace(p+Vector3.Up*.12f,false);Save();
    }
    void ArchiveHeld(bool quick) {
        if(busy||held==null)return;var item=held;
        if(!game.CanArchive(item.State,out string why)){ReturnHeld(why);return;}
        if(!quick&&game.Data.Page!=item.State.Card){ReturnHeld("当前页不是这张卡的归档位置");return;}
        game.Data.Page=item.State.Card;UpdateStations();busy=true;
        motion=TweenHelpers.ReplaceTween(this,motion);motion.TweenProperty(item,"global_position",BinderPoint+Vector3.Up*.035f,.35).SetTrans(Tween.TransitionType.Cubic).SetEase(Tween.EaseType.Out);
        motion.TweenCallback(Callable.From(()=>{int before=game.Data.Archived.Count;game.Archive(item.State,out _);held=null;busy=false;Apply(item);UpdateStations();Tone(1040);ShowNotice(game.Data.Archived.Count==3?"全部归档完成！可以继续自由查看":before==1?"归档成功 · 容器容量提升至 18":"归档成功，空位已填满");Save();}));
    }
    void Hint() {var candidate=game.Data.Items.Where(i=>!game.Data.Archived.Contains(i.Card)&&i.Place is not ("archived" or "assembled")).OrderBy(i=>i.Place=="puzzle"?1:0).FirstOrDefault();if(candidate==null){ShowNotice("所有卡牌已正确归档");return;}var item=items[candidate.Id];hintLight.GlobalPosition=(candidate.Place=="container"?new Vector3(-4.1f,.7f,-2.1f):item.GlobalPosition)+Vector3.Up*.2f;hintTimer=3;ShowNotice($"{Session.Names[candidate.Card]} · 位于 "+(candidate.Place=="container"?"容器内":candidate.Place=="floor"?"房间地面":candidate.Place=="puzzle"?"未完成拼图":"工作台上"),3);}
    void Pause(bool value) {paused=value;GetTree().Paused=value;pausePanel.Visible=value;painting=false;Input.MouseMode=value||atDesk?Input.MouseModeEnum.Visible:Input.MouseModeEnum.Captured;if(motion!=null&&motion.IsValid()){if(value)motion.Pause();else motion.Play();}if(value)Save();}
    void ShowNotice(string text,float seconds=2.3f){notice=text;noticeTimer=seconds;}
    void Tone(float frequency) {if(sound==null)return;byte[] bytes=new byte[2205*2];for(int i=0;i<2205;i++){short v=(short)(Math.Sin(i*frequency*Math.Tau/22050)*Math.Exp(-i/450.0)*5500);bytes[i*2]=(byte)v;bytes[i*2+1]=(byte)(v>>8);}sound.Stream=new AudioStreamWav{Format=AudioStreamWav.FormatEnum.Format16Bits,MixRate=22050,Data=bytes};sound.Play();}
    void Save() {if(!canSave||game==null)return;foreach(var item in items.Values){var p=item.GlobalPosition;item.State.Position=new[]{p.X,p.Y,p.Z};var r=item.Rotation;item.State.Rotation=new[]{r.X,r.Y,r.Z};}game.Data.Player=new[]{player.Position.X,player.Position.Y,player.Position.Z};game.Data.Yaw=yaw;game.Data.Pitch=pitch;try{game.Save(store);}catch(Exception e){canSave=false;ShowNotice("保存失败，保留现有文件："+e.Message,10);GD.PushError(e.Message);}}
    public override void _Notification(int what){if(what==NotificationWMCloseRequest&&game!=null){Save();GetTree().Quit();}}
    void Inspect() {
        if(!game.Data.Archived.Contains(game.Data.Page)){ShowNotice("翻到已归档的页面，再按 I 欣赏");return;}
        var window=new Window{Title=Session.Names[game.Data.Page],Size=new(460,720),Transient=true};
        var texture=new TextureRect{Texture=GD.Load<Texture2D>($"res://assets/{Session.Art[game.Data.Page]}.png"),ExpandMode=TextureRect.ExpandModeEnum.IgnoreSize,StretchMode=TextureRect.StretchModeEnum.KeepAspectCentered};
        texture.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);window.AddChild(texture);AddChild(window);window.CloseRequested+=window.QueueFree;window.PopupCentered();
    }
    async void FlowTest() {
        void Check(bool value,string message){if(!value)throw new Exception(message);}
        void DropAt(Vector3 position){testPoint=position;Drop();testPoint=null;}
        void Wipe(CardItem item){for(int x=0;x<64;x+=6)for(int y=0;y<64;y+=6)item.Paint(item.ToGlobal(new((x/63f-.5f)*item.Size.X,0,(y/63f-.5f)*item.Size.Y)));}
        try {
            for(int n=0;n<4;n++)await ToSignal(GetTree(),SceneTree.SignalName.PhysicsFrame);
            var first=items.Values.Single(i=>i.State.Card==0);roomCamera.LookAt(first.GlobalPosition);
            Check(Ray().Item1==first,"first-person ray selects reachable card");
            _UnhandledInput(new InputEventMouseButton{ButtonIndex=MouseButton.Left,Pressed=true});
            Check(first.State.Place=="container","ray pickup enters container");
            foreach(var item in items.Values)if(item!=first)Check(game.Collect(item.State),"collect remaining fixture");
            foreach(var item in items.Values)Apply(item);
            SetDesk(true);Dump();
            Check(game.Carried==0&&items.Values.All(i=>i.State.Place=="desk"),"batch dump empties container");
            var dirty=items.Values.Single(i=>i.State.Card==1);dirty.Face(true);Take(dirty);DropAt(CleanPoint);
            Check(dirty.State.Place=="clean","cleaning station accepts one card");
            Wipe(dirty);Check(!dirty.State.Dirty&&dirty.State.CleanMask.Length>0,"local dirt mask completed");
            Take(dirty);ArchiveHeld(true);
            await ToSignal(GetTree(),SceneTree.SignalName.ProcessFrame);
            var prior=dirty.GlobalPosition;Pause(true);
            await ToSignal(GetTree().CreateTimer(.13),SceneTreeTimer.SignalName.Timeout);
            Check(dirty.GlobalPosition.DistanceTo(prior)<.001f,"pause freezes archive tween");Pause(false);
            await ToSignal(GetTree().CreateTimer(.5),SceneTreeTimer.SignalName.Timeout);
            Check(game.Data.Archived.SequenceEqual(new[]{1}),"clean card quick archive");
            game.Data.Target=2;UpdateStations();
            foreach(var piece in items.Values.Where(i=>i.State.Card==2).ToArray()) {
                piece.Face(true);Take(piece);
                if(piece.State.Dirty){DropAt(CleanPoint);Wipe(piece);Check(!piece.State.Dirty,"dirty fragment wiped");Take(piece);}
                DropAt(Slot(piece.State.Piece));
                Check(piece.State.Place is "puzzle" or "assembled","piece placed through controller");
            }
            var whole=items.Values.Single(i=>i.State.Card==2&&i.State.Piece==-1);
            Take(whole);game.Data.Page=0;ArchiveHeld(false);
            Check(held==null&&!game.Data.Archived.Contains(2),"wrong manual page returns card");
            Take(whole);ArchiveHeld(true);await ToSignal(GetTree().CreateTimer(.5),SceneTreeTimer.SignalName.Timeout);
            Check(game.Data.Archived.Count==2&&game.Capacity==18,"assembly archive unlocks capacity");
            first.Face(true);Take(first);ArchiveHeld(true);await ToSignal(GetTree().CreateTimer(.5),SceneTreeTimer.SignalName.Timeout);
            Check(game.Data.Archived.Count==3,"all three cards archived");
            store=new(System.IO.Path.Combine(System.IO.Path.GetTempPath(),"a16-flow-"+Guid.NewGuid(),"study.json"),new StudyCodec());canSave=true;Save();canSave=false;
            var read=store.Inspect();Check(read.CanContinue&&read.Snapshot.Archived.Count==3&&read.Snapshot.Items.Count==9,"scene snapshot restored");
            GD.Print("PASS: real scene/ray pickup, dump, stroke masks, pause tween, six-piece assembly, wrong-page rejection, quick archive, capacity and isolated scene save");GetTree().Quit(0);
        } catch(Exception e){GD.PushError(e.ToString());GetTree().Quit(1);}
    }
    void StageCapture() {
        game.Data.Archived.Add(0);game.Data.Page=0;
        foreach(var item in items.Values) {
            item.State.Front=true;
            if(item.State.Card==0)item.State.Place="archived";
            else if(item.State.Card==1)item.State.Place="clean";
            else if(item.State.Piece<3){item.State.Place="puzzle";item.State.Dirty=false;}
            else {item.State.Place="desk";item.SetPlace(new(-.9f+(item.State.Piece-3)*.7f,1.2f,-1.45f),true);}
            item.Face(true);Apply(item);
            if(item.State.Place=="desk")item.Freeze=true;
        }
        UpdateStations();
    }
    async void CaptureSoon() {await ToSignal(GetTree().CreateTimer(2),SceneTreeTimer.SignalName.Timeout);await ToSignal(RenderingServer.Singleton,RenderingServer.SignalName.FramePostDraw);var output=ProjectSettings.GlobalizePath(atDesk?"res://../outputs/godot-study-desk.png":"res://../outputs/godot-study-room.png");GetViewport().GetTexture().GetImage().SavePng(output);GD.Print("CAPTURE: "+output);GetTree().Quit();}
}
