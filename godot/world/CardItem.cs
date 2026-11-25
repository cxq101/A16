using Godot;
using System;
using System.Collections.Generic;
namespace A16;
public partial class CardItem : RigidBody3D {
    public ItemState State;
    public Vector2 Size;
    Node3D visual;
    CollisionPolygon3D collision;
    ShaderMaterial front;
    Image mask;
    ImageTexture maskTexture;
    int painted;
    public const float CardWidth=.84f,CardHeight=1.26f;
    public void Setup(ItemState state) {
        State=state;Size=state.Piece<0?new(CardWidth,CardHeight):new(CardWidth/2,CardHeight/3);
        Name="Card_"+state.Id.Replace(":","_");Mass=.025f;LockRotation=true;LinearDamp=1.7f;AngularDamp=2;
        ContinuousCd=true;CollisionLayer=2;CollisionMask=3;PhysicsMaterialOverride=new PhysicsMaterial{Friction=.85f,Bounce=.03f};
        visual=new Node3D();AddChild(visual);
        var polygon=Outline(state.Piece);
        collision=new CollisionPolygon3D{Polygon=polygon,Depth=.025f,Rotation=new(state.Front?Mathf.Pi/2:-Mathf.Pi/2,0,0)};AddChild(collision);
        mask=Image.CreateEmpty(64,64,false,Image.Format.Rgba8);mask.Fill(Colors.Black);
        if(state.CleanMask.Length>0)try{mask.LoadPngFromBuffer(Convert.FromBase64String(state.CleanMask));}catch{mask.Fill(Colors.Black);}
        for(int x=0;x<64;x++)for(int y=0;y<64;y++)if(mask.GetPixel(x,y).R>.5f)painted++;
        maskTexture=ImageTexture.CreateFromImage(mask);
        var shader=new Shader();shader.Code=@"shader_type spatial;
render_mode cull_back;
uniform sampler2D picture : source_color;
uniform sampler2D clean_mask;
uniform bool dirty = false;
float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void fragment(){vec3 paper=texture(picture,UV).rgb;
float s=sin(UV.x*24.0+sin(UV.y*17.0))*sin(UV.y*19.0+UV.x*9.0)*.5+.5;
float stain=smoothstep(.13,.43,s)*(.82+noise(floor(UV*190.0))*.18);
float grime=(dirty?1.0:0.0)*(1.0-texture(clean_mask,UV2).r)*stain;
ALBEDO=mix(paper,vec3(.19,.135,.08),grime*.91);ROUGHNESS=.65;METALLIC=.025;}";
        front=new ShaderMaterial{Shader=shader};front.SetShaderParameter("picture",GD.Load<Texture2D>($"res://assets/{Session.Art[state.Card]}.png"));
        front.SetShaderParameter("clean_mask",maskTexture);front.SetShaderParameter("dirty",state.Dirty);
        var back=new StandardMaterial3D{AlbedoTexture=GD.Load<Texture2D>("res://assets/back.png"),Roughness=.55f};
        visual.AddChild(new MeshInstance3D{Mesh=MakeMesh(polygon,false),MaterialOverride=front});
        visual.AddChild(new MeshInstance3D{Mesh=MakeMesh(polygon,true),MaterialOverride=back});
        visual.AddChild(new MeshInstance3D{Mesh=Edges(polygon),MaterialOverride=new StandardMaterial3D{AlbedoColor=new Color("ded4b6"),Roughness=.85f,CullMode=BaseMaterial3D.CullModeEnum.Disabled}});
        visual.Rotation=new(state.Front?0:Mathf.Pi,0,0);
        GlobalPosition=new(state.Position[0],state.Position[1],state.Position[2]);
    }
    Vector2[] Outline(int piece) {
        float w=Size.X,h=Size.Y;
        if(piece<0)return new[]{new Vector2(-w/2,-h/2),new(w/2,-h/2),new(w/2,h/2),new(-w/2,h/2)};
        int c=piece%2,r=piece/2;float Sign(int a)=>a%2==0?1:-1;
        float top=r==0?0:-Sign(c+r-1),right=c==1?0:Sign(c+r),bottom=r==2?0:Sign(c+r),left=c==0?0:-Sign(c-1+r);
        var points=new List<Vector2>();
        for(int side=0;side<4;side++)for(int j=0;j<32;j++) {
            float t=j/32f;float a=(t-.31f)/.38f;float b=a>0&&a<1?Mathf.Sin(a*Mathf.Pi)*.073f:0;
            points.Add(side switch {0=>new(-w/2+t*w,-h/2-top*b),1=>new(w/2+right*b,-h/2+t*h),2=>new(w/2-t*w,h/2+bottom*b),_=>new(-w/2-left*b,h/2-t*h)});
        }
        return points.ToArray();
    }
    ArrayMesh MakeMesh(Vector2[] points,bool back) {
        var vertices=new Vector3[points.Length];var normals=new Vector3[points.Length];var uv=new Vector2[points.Length];var uv2=new Vector2[points.Length];
        for(int j=0;j<points.Length;j++) {
            var p=points[j];vertices[j]=new(p.X,back?-.015f:.015f,p.Y);normals[j]=back?Vector3.Down:Vector3.Up;
            var local=new Vector2(p.X/Size.X+.5f,p.Y/Size.Y+.5f);uv2[j]=local;
            uv[j]=State.Piece<0?local:new((State.Piece%2+local.X)/2,(State.Piece/2+local.Y)/3);
        }
        var triangles=Geometry2D.TriangulatePolygon(points);
        // XZ has the opposite winding to XY.
        if(back)for(int j=0;j<triangles.Length;j+=3)(triangles[j+1],triangles[j+2])=(triangles[j+2],triangles[j+1]);
        var arrays=new Godot.Collections.Array();arrays.Resize((int)Mesh.ArrayType.Max);
        arrays[(int)Mesh.ArrayType.Vertex]=vertices;arrays[(int)Mesh.ArrayType.Normal]=normals;arrays[(int)Mesh.ArrayType.TexUV]=uv;arrays[(int)Mesh.ArrayType.TexUV2]=uv2;arrays[(int)Mesh.ArrayType.Index]=triangles;
        var mesh=new ArrayMesh();mesh.AddSurfaceFromArrays(Mesh.PrimitiveType.Triangles,arrays);return mesh;
    }
    ArrayMesh Edges(Vector2[] polygon) {
        var vertices=new List<Vector3>();var normals=new List<Vector3>();var index=new List<int>();
        for(int i=0;i<polygon.Length;i++) {
            var a=polygon[i];var b=polygon[(i+1)%polygon.Length];var d=(b-a).Normalized();var normal=new Vector3(d.Y,0,-d.X);int start=vertices.Count;
            vertices.AddRange(new[]{new Vector3(a.X,-.015f,a.Y),new(a.X,.015f,a.Y),new(b.X,.015f,b.Y),new(b.X,-.015f,b.Y)});
            for(int n=0;n<4;n++)normals.Add(normal);index.AddRange(new[]{start,start+1,start+2,start,start+2,start+3});
        }
        var arrays=new Godot.Collections.Array();arrays.Resize((int)Mesh.ArrayType.Max);arrays[(int)Mesh.ArrayType.Vertex]=vertices.ToArray();arrays[(int)Mesh.ArrayType.Normal]=normals.ToArray();arrays[(int)Mesh.ArrayType.Index]=index.ToArray();var mesh=new ArrayMesh();mesh.AddSurfaceFromArrays(Mesh.PrimitiveType.Triangles,arrays);return mesh;
    }
    public void Face(bool frontSide) {State.Front=frontSide;collision.Rotation=new(frontSide?Mathf.Pi/2:-Mathf.Pi/2,0,0);front.SetShaderParameter("dirty",State.Dirty);visual.Rotation=new(frontSide?0:Mathf.Pi,0,0);}
    public float Paint(Vector3 point) {
        if(!State.Front||!State.Dirty)return 1;
        var p=ToLocal(point);int cx=(int)((p.X/Size.X+.5f)*63),cy=(int)((p.Z/Size.Y+.5f)*63);
        for(int x=Math.Max(0,cx-8);x<=Math.Min(63,cx+8);x++)for(int y=Math.Max(0,cy-8);y<=Math.Min(63,cy+8);y++) {
            if((x-cx)*(x-cx)+(y-cy)*(y-cy)>64||mask.GetPixel(x,y).R>.5f)continue;
            mask.SetPixel(x,y,Colors.White);painted++;
        }
        float ratio=painted/4096f;
        if(ratio>=.72f){State.Dirty=false;front.SetShaderParameter("dirty",false);mask.Fill(Colors.White);ratio=1;}
        maskTexture.Update(mask);State.CleanMask=Convert.ToBase64String(mask.SavePngToBuffer());return ratio;
    }
    public Vector2[] WorldOutline() => Array.ConvertAll(Outline(State.Piece),p=> {
        var world=visual.ToGlobal(new Vector3(p.X,0,p.Y));return new Vector2(world.X,world.Z);
    });
    public void SetPlace(Vector3 position,bool frozen) {Freeze=frozen;LinearVelocity=Vector3.Zero;AngularVelocity=Vector3.Zero;GlobalPosition=position;}
}
